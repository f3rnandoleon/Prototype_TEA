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

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Los profesionales de salud no gestionan actividades educativas de aula; esta función corresponde al docente y tutor.' },
        { status: 403 }
      );
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

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Los profesionales de salud no tienen acceso a asignar actividades educativas; esta atribución es exclusiva del docente o tutor.' },
        { status: 403 }
      );
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Los profesionales de salud no gestionan asignaciones de actividades educativas.' },
        { status: 403 }
      );
    }

    // Permitir obtener el ID de la asignación por query param o por body
    const searchId = req.nextUrl.searchParams.get('id') || req.nextUrl.searchParams.get('assignmentId');
    let assignmentId = searchId;
    let childIdParam = req.nextUrl.searchParams.get('childId');
    let activityIdParam = req.nextUrl.searchParams.get('activityId');

    if (!assignmentId && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        assignmentId = body.assignmentId || body.id;
        childIdParam = childIdParam || body.childId;
        activityIdParam = activityIdParam || body.activityId;
      } catch {
        // Ignorar error al parsear body vacío
      }
    }

    await connectDB();

    let assignment = null;
    if (assignmentId) {
      assignment = await ActivityAssignmentModel.findById(assignmentId);
    } else if (childIdParam && activityIdParam) {
      assignment = await ActivityAssignmentModel.findOne({
        childId: childIdParam,
        activityId: activityIdParam,
      });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    // Verificar permiso 'activity.assign' sobre el niño
    const auth = await authorizeChildAccess(session.userId, session.role, assignment.childId.toString(), 'activity.assign');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para desasignar actividades' }, { status: 403 });
    }

    const removedChildId = assignment.childId.toString();
    const removedActivityId = assignment.activityId.toString();
    const removedAssignmentId = assignment._id.toString();

    await ActivityAssignmentModel.findByIdAndDelete(assignment._id);

    await logAuditEvent({
      userId: session.userId,
      childId: removedChildId,
      action: 'ACTIVITY_UNASSIGNED',
      resource: 'ActivityAssignment',
      details: { activityId: removedActivityId, assignmentId: removedAssignmentId },
    });

    return NextResponse.json({
      message: 'Actividad desasignada correctamente',
      assignmentId: removedAssignmentId,
      childId: removedChildId,
      activityId: removedActivityId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al desasignar actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.role === 'professional') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { assignmentId, dueDate, status } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId es obligatorio' }, { status: 400 });
    }

    await connectDB();
    const assignment = await ActivityAssignmentModel.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, assignment.childId.toString(), 'activity.assign');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para modificar la asignación' }, { status: 403 });
    }

    if (dueDate !== undefined) {
      assignment.dueDate = dueDate ? new Date(dueDate) : undefined;
    }
    if (status !== undefined) {
      assignment.status = status;
    }

    await assignment.save();

    await logAuditEvent({
      userId: session.userId,
      childId: assignment.childId.toString(),
      action: 'ACTIVITY_ASSIGNMENT_UPDATED',
      resource: 'ActivityAssignment',
      details: { assignmentId, status, dueDate },
    });

    return NextResponse.json({
      message: 'Asignación actualizada correctamente',
      assignment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar asignación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

