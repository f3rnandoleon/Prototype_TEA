import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { GoalModel } from '@/models/Goal';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

interface RouteContext {
  params: {
    goalId: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { goalId } = params;
    await connectDB();
    const goal = await GoalModel.findById(goalId);
    if (!goal) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, goal.childId.toString(), 'goal.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para actualizar objetivos' }, { status: 403 });
    }

    const body = await req.json();
    const { status, newNote } = body;

    if (status) {
      goal.status = status;
    }

    if (newNote && newNote.trim()) {
      goal.progressNotes.push({
        date: new Date(),
        note: newNote.trim(),
        authorId: new Types.ObjectId(session.userId),
      });
    }

    await goal.save();

    await logAuditEvent({
      userId: session.userId,
      childId: goal.childId.toString(),
      action: 'GOAL_UPDATED',
      resource: 'Goal',
      details: { goalId, status, hasNewNote: !!newNote },
    });

    return NextResponse.json({ message: 'Objetivo actualizado con éxito', goal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar objetivo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
