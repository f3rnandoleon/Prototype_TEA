import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';
import { AACBoardModel } from '@/models/AACBoard';
import { updateChildSchema } from '@/lib/validations/child';
import { authorizeChildAccess, authorizeChildOwner } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    childId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { childId } = params;
    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'child.profile.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    await connectDB();
    const child = await ChildModel.findById(childId);
    if (!child) {
      return NextResponse.json({ error: 'Perfil infantil no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ child });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al consultar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { childId } = params;
    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'child.profile.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateChildSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await ChildModel.findByIdAndUpdate(childId, parsed.data, { new: true });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'CHILD_UPDATED',
      resource: 'Child',
      details: { updatedFields: Object.keys(parsed.data) },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Perfil actualizado', child: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { childId } = params;
    const auth = await authorizeChildOwner(session.userId, childId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Solo el tutor puede eliminar este perfil' }, { status: 403 });
    }

    await connectDB();
    await ChildModel.findByIdAndDelete(childId);
    await ChildAccessModel.deleteMany({ childId });
    await AACBoardModel.deleteMany({ childId });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'CHILD_DELETED',
      resource: 'Child',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Perfil infantil eliminado correctamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
