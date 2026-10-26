import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { SomaticLogModel } from '@/models/SomaticLog';
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
    const logs = await SomaticLogModel.find({ childId })
      .populate('authorId', 'name email role specialty')
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener bitácora somática';
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
    const { childId, date, sleepHours, sleepQuality, appetite, physicalDiscomfort, discomfortNotes, wellbeingNote } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    const log = await SomaticLogModel.create({
      childId,
      authorId: session.userId,
      date: date ? new Date(date) : new Date(),
      sleepHours: sleepHours !== undefined ? Number(sleepHours) : undefined,
      sleepQuality: sleepQuality || 'bueno',
      appetite: appetite || 'normal',
      physicalDiscomfort: physicalDiscomfort || 'ninguno',
      discomfortNotes: discomfortNotes || '',
      wellbeingNote: wellbeingNote || '',
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'SOMATIC_LOG_CREATED',
      resource: 'SomaticLog',
      details: { sleepQuality, physicalDiscomfort },
    });

    return NextResponse.json(
      { message: 'Registro somático guardado con éxito', log },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar registro somático';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
