import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { RoutineModel } from '@/models/Routine';
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

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado a rutinas' }, { status: 403 });
    }

    await connectDB();
    const routines = await RoutineModel.find({ childId }).sort({ startTime: 1, createdAt: -1 });

    return NextResponse.json({ routines });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar rutinas';
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
    const { childId, title, description, category, daysOfWeek, startTime, steps } = body;

    if (!childId || !title) {
      return NextResponse.json({ error: 'childId y title son obligatorios' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado para crear rutinas' }, { status: 403 });
    }

    await connectDB();
    const newRoutine = await RoutineModel.create({
      childId,
      title,
      description: description || '',
      category: category || 'manana',
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      startTime: startTime || '08:00',
      isActive: true,
      steps: steps || [],
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'ROUTINE_CREATED',
      resource: 'Routine',
      details: { title, stepsCount: steps?.length || 0 },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Rutina creada con éxito', routine: newRoutine }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear rutina';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
