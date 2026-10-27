import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ObservationModel } from '@/models/Observation';
import { ChildModel } from '@/models/Child';
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

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado a observaciones' }, { status: 403 });
    }

    await connectDB();

    // Filtrar por visibilidad permitida para el rol del usuario
    const observations = await ObservationModel.find({
      childId,
      visibility: session.role,
    })
      .populate('authorId', 'name email role specialty')
      .populate('scheduleEventId', 'title date startTime iconEmoji badgeLabel')
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ observations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar observaciones';
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
    const { childId, category, description, supportsUsed, observedOutcome, visibility, date, scheduleEventId } = body;

    if (!childId || !category || !description) {
      return NextResponse.json({ error: 'childId, category y description son obligatorios' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para registrar observaciones' }, { status: 403 });
    }

    await connectDB();
    const observation = await ObservationModel.create({
      childId,
      authorId: session.userId,
      date: date ? new Date(date) : new Date(),
      category,
      description,
      supportsUsed: supportsUsed || [],
      observedOutcome: observedOutcome || '',
      visibility: visibility || ['tutor', 'professional', 'teacher'],
      scheduleEventId: scheduleEventId || undefined,
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'OBSERVATION_CREATED',
      resource: 'Observation',
      details: { category, visibility },
    });

    return NextResponse.json(
      { message: 'Observación registrada exitosamente', observation },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar observación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
