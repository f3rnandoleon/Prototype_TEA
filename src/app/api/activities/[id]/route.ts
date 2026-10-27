import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ActivityModel } from '@/models/Activity';
import { ActivityAssignmentModel } from '@/models/ActivityAssignment';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Acceso restringido: El catálogo de actividades educativas es de uso exclusivo para docentes y tutores.' },
        { status: 403 }
      );
    }

    const { id } = params;
    await connectDB();

    const activity = await ActivityModel.findById(id);
    if (!activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener la actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Los profesionales clínicos no gestionan actividades educativas de aula; esta función corresponde a docentes y tutores.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, skillType, activityType, difficulty, instructions, config } = body;

    if (!title || !activityType || !config) {
      return NextResponse.json({ error: 'Datos incompletos para actualizar la actividad' }, { status: 400 });
    }

    await connectDB();

    const activity = await ActivityModel.findById(id);
    if (!activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    // Actualizar campos
    activity.title = title;
    activity.description = description !== undefined ? description : activity.description;
    activity.skillType = skillType || activity.skillType;
    activity.activityType = activityType;
    activity.difficulty = difficulty || activity.difficulty;
    activity.instructions = instructions !== undefined ? instructions : activity.instructions;
    activity.config = config;

    await activity.save();

    await logAuditEvent({
      userId: session.userId,
      action: 'ACTIVITY_UPDATED',
      resource: 'Activity',
      details: { activityId: id, title, activityType },
    });

    return NextResponse.json({
      message: 'Actividad actualizada exitosamente',
      activity,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.role === 'professional') {
      return NextResponse.json(
        { error: 'Los profesionales clínicos no gestionan actividades educativas.' },
        { status: 403 }
      );
    }

    const { id } = params;
    await connectDB();

    const activity = await ActivityModel.findById(id);
    if (!activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    // Eliminar actividad
    await ActivityModel.findByIdAndDelete(id);

    // Limpiar asignaciones asociadas a esta actividad
    await ActivityAssignmentModel.deleteMany({ activityId: id });

    await logAuditEvent({
      userId: session.userId,
      action: 'ACTIVITY_DELETED',
      resource: 'Activity',
      details: { activityId: id, title: activity.title },
    });

    return NextResponse.json({
      message: 'Actividad eliminada correctamente',
      activityId: id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
