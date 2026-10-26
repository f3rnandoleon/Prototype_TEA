import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ABCLogModel } from '@/models/ABCLog';
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
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    await connectDB();
    const logs = await ABCLogModel.find({
      childId,
      visibility: session.role,
    })
      .populate('authorId', 'name email role specialty')
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener registros ABC';
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
    const { childId, date, antecedentContext, observedBehavior, unmetNeed, supportProvided, outcome, visibility } = body;

    if (!childId || !antecedentContext || !observedBehavior || !supportProvided || !outcome) {
      return NextResponse.json(
        { error: 'childId, antecedente, conducta observable, apoyo y resultado son requeridos' },
        { status: 400 }
      );
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    const log = await ABCLogModel.create({
      childId,
      authorId: session.userId,
      date: date ? new Date(date) : new Date(),
      antecedentContext,
      observedBehavior,
      unmetNeed: unmetNeed || '',
      supportProvided,
      outcome,
      visibility: visibility || ['tutor', 'professional', 'teacher'],
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'ABC_LOG_CREATED',
      resource: 'ABCLog',
      details: { visibility: log.visibility },
    });

    return NextResponse.json(
      { message: 'Registro ABC guardado exitosamente', log },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar registro ABC';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
