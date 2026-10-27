import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ScheduleEventModel } from '@/models/ScheduleEvent';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get('childId');
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();
    const session = await getSessionUser(req);
    if (session) {
      const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.read');
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
      }
    }

    const events = await ScheduleEventModel.find({ childId })
      .sort({ date: 1, startTime: 1 });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar eventos';
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
    const {
      childId,
      title,
      description,
      date,
      endDate,
      startTime,
      endTime,
      iconEmoji,
      isNonRoutine,
      anticipationVisualUrl,
      alertLevel,
      visualPrepNotes,
      badgeStyle,
      badgeColor,
      badgeLabel,
    } = body;

    if (!childId || !title || !date) {
      return NextResponse.json({ error: 'childId, title y date son requeridos' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    const event = await ScheduleEventModel.create({
      childId,
      title,
      description: description || '',
      date,
      endDate: endDate || '',
      startTime: startTime || '09:00',
      endTime: endTime || '',
      iconEmoji: iconEmoji || '📅',
      isNonRoutine: isNonRoutine !== undefined ? isNonRoutine : true,
      anticipationVisualUrl: anticipationVisualUrl || '',
      alertLevel: alertLevel || 'informativo',
      visualPrepNotes: visualPrepNotes || '',
      badgeStyle: badgeStyle || 'pill',
      badgeColor: badgeColor || 'purple',
      badgeLabel: badgeLabel || '',
      createdBy: session.userId,
      creatorRole: session.role,
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'SCHEDULE_EVENT_CREATED',
      resource: 'ScheduleEvent',
      details: { title, alertLevel, isNonRoutine },
    });

    return NextResponse.json(
      { message: 'Evento programado exitosamente', event },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear evento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const eventId = req.nextUrl.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId es requerido' }, { status: 400 });
    }

    await connectDB();
    const event = await ScheduleEventModel.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, event.childId.toString(), 'routine.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: 'No autorizado para eliminar este evento' }, { status: 403 });
    }

    await ScheduleEventModel.findByIdAndDelete(eventId);

    return NextResponse.json({ message: 'Evento eliminado exitosamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar evento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
