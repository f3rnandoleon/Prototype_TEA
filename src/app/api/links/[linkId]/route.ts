import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';
import { updateAccessSchema } from '@/lib/validations/link';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    linkId: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { linkId } = params;
    const body = await req.json();
    const parsed = updateAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await connectDB();
    const link = await ChildAccessModel.findById(linkId);
    if (!link) {
      return NextResponse.json({ error: 'Vinculación no encontrada' }, { status: 404 });
    }

    const child = await ChildModel.findById(link.childId);
    if (!child) {
      return NextResponse.json({ error: 'Perfil infantil asociado no encontrado' }, { status: 404 });
    }

    const isTutorOwner = child.tutorId.toString() === session.userId;
    const isTargetUser = link.userId.toString() === session.userId;

    if (!isTutorOwner && !isTargetUser) {
      return NextResponse.json({ error: 'No autorizado para modificar esta vinculación' }, { status: 403 });
    }

    // El destinatario (docente/profesional) solo puede aceptar o rechazar una invitación pendiente
    if (isTargetUser && !isTutorOwner) {
      if (parsed.data.status && ['accepted', 'rejected'].includes(parsed.data.status)) {
        link.status = parsed.data.status;
        await link.save();

        await logAuditEvent({
          userId: session.userId,
          childId: link.childId.toString(),
          action: `LINK_${link.status.toUpperCase()}`,
          resource: 'ChildAccess',
          details: { linkId, status: link.status },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({ message: `Invitación ${link.status}`, link });
      } else {
        return NextResponse.json(
          { error: 'El usuario invitado solo puede aceptar o rechazar la invitación' },
          { status: 400 }
        );
      }
    }

    // El tutor propietario puede cambiar permisos o cambiar el estado (ej. revocar)
    if (isTutorOwner) {
      if (parsed.data.permissions) {
        link.permissions = link.role === 'professional'
          ? parsed.data.permissions.filter((p: string) => p !== 'activity.assign' && p !== 'activity.create')
          : parsed.data.permissions;
      }
      if (parsed.data.status) {
        link.status = parsed.data.status;
      }
      await link.save();

      await logAuditEvent({
        userId: session.userId,
        childId: link.childId.toString(),
        action: 'LINK_PERMISSIONS_UPDATED',
        resource: 'ChildAccess',
        details: { linkId, status: link.status, permissions: link.permissions },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ message: 'Vinculación actualizada correctamente', link });
    }

    return NextResponse.json({ error: 'Operación no permitida' }, { status: 403 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar vinculación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { linkId } = params;
    await connectDB();
    const link = await ChildAccessModel.findById(linkId);
    if (!link) {
      return NextResponse.json({ error: 'Vinculación no encontrada' }, { status: 404 });
    }

    const child = await ChildModel.findById(link.childId);
    if (!child || child.tutorId.toString() !== session.userId) {
      return NextResponse.json({ error: 'Solo el tutor responsable puede revocar la vinculación' }, { status: 403 });
    }

    // Revocación lógica inmediata
    link.status = 'revoked';
    await link.save();

    await logAuditEvent({
      userId: session.userId,
      childId: link.childId.toString(),
      action: 'LINK_REVOKED',
      resource: 'ChildAccess',
      details: { linkId, targetUserId: link.userId.toString() },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Vinculación revocada exitosamente. Acceso invalidado.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al revocar vinculación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
