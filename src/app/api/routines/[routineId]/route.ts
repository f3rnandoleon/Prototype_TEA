import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { RoutineModel } from '@/models/Routine';
import { RoutineProgressModel } from '@/models/RoutineProgress';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    routineId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { routineId } = params;
    await connectDB();
    const routine = await RoutineModel.findById(routineId);
    if (!routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, routine.childId.toString(), 'routine.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({ routine });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar rutina';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { routineId } = params;
    await connectDB();
    const routine = await RoutineModel.findById(routineId);
    if (!routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, routine.childId.toString(), 'routine.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para editar rutinas' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await RoutineModel.findByIdAndUpdate(routineId, body, { new: true });

    await logAuditEvent({
      userId: session.userId,
      childId: routine.childId.toString(),
      action: 'ROUTINE_UPDATED',
      resource: 'Routine',
      details: { routineId },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Rutina actualizada', routine: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar rutina';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { routineId } = params;
    await connectDB();
    const routine = await RoutineModel.findById(routineId);
    if (!routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, routine.childId.toString(), 'routine.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para eliminar rutinas' }, { status: 403 });
    }

    await RoutineModel.findByIdAndDelete(routineId);
    await RoutineProgressModel.deleteMany({ routineId });

    await logAuditEvent({
      userId: session.userId,
      childId: routine.childId.toString(),
      action: 'ROUTINE_DELETED',
      resource: 'Routine',
      details: { routineId },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Rutina eliminada correctamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar rutina';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
