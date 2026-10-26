import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { ActivityResultModel } from '@/models/ActivityResult';
import { ActivityAssignmentModel } from '@/models/ActivityAssignment';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    id: string; // activityId
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: activityId } = params;
    const body = await req.json();
    const { childId, assignmentId, score, totalItems, supportsUsed, timeSpentSeconds, feedbackNotes } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();

    const result = await ActivityResultModel.create({
      activityId,
      childId,
      assignmentId: assignmentId || undefined,
      score: score || 0,
      totalItems: totalItems || 0,
      supportsUsed: supportsUsed || [],
      timeSpentSeconds: timeSpentSeconds || 0,
      feedbackNotes: feedbackNotes || '',
    });

    // Si provenía de una asignación específica, marcarla como completada
    if (assignmentId) {
      await ActivityAssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'completed',
      });
    }

    return NextResponse.json(
      { message: 'Resultado de actividad guardado correctamente', result },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar resultado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
