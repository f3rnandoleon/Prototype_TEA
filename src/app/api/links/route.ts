import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ChildModel } from '@/models/Child';
import { UserModel } from '@/models/User';
import { ChildAccessModel } from '@/models/ChildAccess';
import { inviteUserSchema } from '@/lib/validations/link';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await connectDB();

    if (session.role === 'tutor') {
      // Obtener los niños del tutor
      const myChildren = await ChildModel.find({ tutorId: session.userId }).select('_id');
      const childIds = myChildren.map((c) => c._id);

      const links = await ChildAccessModel.find({ childId: { $in: childIds } })
        .populate('userId', 'name email role specialty')
        .populate('childId', 'name nickname avatarUrl')
        .sort({ createdAt: -1 });

      return NextResponse.json({ links });
    }

    // Profesional o docente: ver vinculaciones dirigidas a él
    const links = await ChildAccessModel.find({ userId: session.userId })
      .populate('childId', 'name nickname avatarUrl')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ links });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al consultar vinculaciones';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = inviteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de invitación inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { childId, email, role, permissions } = parsed.data;

    // Verificar autorización: solo tutor o quien tenga 'child.access.manage'
    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'child.access.manage');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado para invitar' }, { status: 403 });
    }

    await connectDB();

    // Buscar si el usuario invitado existe en el sistema
    const targetUser = await UserModel.findOne({ email });
    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            'No se encontró ningún usuario con ese correo electrónico. El profesional o docente debe registrarse primero.',
        },
        { status: 404 }
      );
    }

    // Verificar si ya existe una vinculación
    const existing = await ChildAccessModel.findOne({
      childId,
      userId: targetUser._id,
    });

    if (existing) {
      if (existing.status === 'revoked') {
        // Reactivar con nuevos permisos
        existing.status = 'pending';
        existing.permissions = permissions;
        existing.role = role;
        await existing.save();

        await logAuditEvent({
          userId: session.userId,
          childId,
          action: 'LINK_REACTIVATED',
          resource: 'ChildAccess',
          details: { targetUserId: targetUser._id.toString(), permissions },
        });

        return NextResponse.json({ message: 'Invitación reenviada correctamente', link: existing });
      }

      return NextResponse.json(
        { error: 'Ya existe una vinculación activa o pendiente con este usuario' },
        { status: 409 }
      );
    }

    const newLink = await ChildAccessModel.create({
      childId,
      userId: targetUser._id,
      invitedBy: session.userId,
      role,
      status: 'pending',
      permissions,
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'LINK_CREATED',
      resource: 'ChildAccess',
      details: { targetUserId: targetUser._id.toString(), targetEmail: email, role, permissions },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { message: 'Invitación creada exitosamente', link: newLink },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear invitación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
