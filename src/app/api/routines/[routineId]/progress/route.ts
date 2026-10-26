import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { RoutineModel } from '@/models/Routine';
import { RoutineProgressModel } from '@/models/RoutineProgress';
import { authorizeChildAccess } from '@/lib/security/policies';

interface RouteContext {
  params: {
    routineId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { routineId } = params;
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    await connectDB();
    const progress = await RoutineProgressModel.findOne({ routineId, date });

    return NextResponse.json({
      progress: progress || {
        routineId,
        date,
        completedStepIds: [],
        status: 'not_started',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar progreso de rutina';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { routineId } = params;
    const body = await req.json();
    const { stepId, isCompleted, date = new Date().toISOString().split('T')[0] } = body;

    await connectDB();
    const routine = await RoutineModel.findById(routineId);
    if (!routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    let progress = await RoutineProgressModel.findOne({ routineId, date });

    if (!progress) {
      progress = new RoutineProgressModel({
        childId: routine.childId,
        routineId,
        date,
        completedStepIds: [],
        status: 'in_progress',
      });
    }

    if (isCompleted) {
      if (!progress.completedStepIds.includes(stepId)) {
        progress.completedStepIds.push(stepId);
      }
    } else {
      progress.completedStepIds = progress.completedStepIds.filter((id) => id !== stepId);
    }

    // Si completó todos los pasos de la rutina
    if (routine.steps.length > 0 && progress.completedStepIds.length >= routine.steps.length) {
      progress.status = 'completed';
      progress.completedAt = new Date();
    } else if (progress.completedStepIds.length > 0) {
      progress.status = 'in_progress';
    } else {
      progress.status = 'not_started';
    }

    await progress.save();

    return NextResponse.json({ message: 'Progreso actualizado', progress });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar progreso';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
