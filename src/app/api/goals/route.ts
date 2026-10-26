import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { GoalModel } from '@/models/Goal';
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

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado a objetivos' }, { status: 403 });
    }

    await connectDB();
    const goals = await GoalModel.find({ childId })
      .populate('responsibleId', 'name email role specialty')
      .sort({ createdAt: -1 });

    return NextResponse.json({ goals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar objetivos';
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
    const { childId, description, area, startDate, targetDate, criteria } = body;

    if (!childId || !description || !area || !criteria) {
      return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'goal.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para crear objetivos' }, { status: 403 });
    }

    await connectDB();
    const goal = await GoalModel.create({
      childId,
      description,
      area,
      responsibleId: session.userId,
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      criteria,
      status: 'en_progreso',
      progressNotes: [],
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'GOAL_CREATED',
      resource: 'Goal',
      details: { area, description },
    });

    return NextResponse.json({ message: 'Objetivo creado correctamente', goal }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear objetivo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
