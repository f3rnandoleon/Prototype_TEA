import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ActivityAssignmentModel } from '@/models/ActivityAssignment';
import { ActivityModel } from '@/models/Activity';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const childId = req.nextUrl.searchParams.get('childId');
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();
    const assignments = await ActivityAssignmentModel.find({ childId })
      .populate('activityId')
      .populate('assignedBy', 'name email role')
      .sort({ assignedAt: -1 });

    return NextResponse.json({ assignments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar asignaciones';
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
    const { childId, activityId, dueDate } = body;

    if (!childId || !activityId) {
      return NextResponse.json({ error: 'childId y activityId son obligatorios' }, { status: 400 });
    }

    // Verificar permiso 'activity.assign'
    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'activity.assign');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para asignar actividades' }, { status: 403 });
    }

    await connectDB();
    const assignment = await ActivityAssignmentModel.create({
      childId,
      activityId,
      assignedBy: session.userId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'ACTIVITY_ASSIGNED',
      resource: 'ActivityAssignment',
      details: { activityId, assignmentId: assignment._id.toString() },
    });

    return NextResponse.json(
      { message: 'Actividad asignada correctamente', assignment },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al asignar actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
