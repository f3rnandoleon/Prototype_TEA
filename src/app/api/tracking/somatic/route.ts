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
    const {
      childId,
      date,
      sleepHours,
      sleepQuality,
      appetite,
      physicalDiscomfort,
      discomfortNotes,
      wellbeingNote,
      symptoms,
      mood,
      energyLevel,
      supportsUsed,
      logId,
    } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let log;
    if (logId) {
      log = await SomaticLogModel.findById(logId);
    } else {
      // Buscar si ya existe para este niño en esta fecha
      log = await SomaticLogModel.findOne({
        childId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });
    }

    if (log) {
      if (sleepHours !== undefined) log.sleepHours = Number(sleepHours);
      if (sleepQuality) log.sleepQuality = sleepQuality;
      if (appetite) log.appetite = appetite;
      if (physicalDiscomfort) log.physicalDiscomfort = physicalDiscomfort;
      if (discomfortNotes !== undefined) log.discomfortNotes = discomfortNotes;
      if (wellbeingNote !== undefined) log.wellbeingNote = wellbeingNote;
      if (symptoms !== undefined) log.symptoms = symptoms;
      if (mood !== undefined) log.mood = mood;
      if (energyLevel !== undefined) log.energyLevel = energyLevel;
      if (supportsUsed !== undefined) log.supportsUsed = supportsUsed;
      await log.save();
    } else {
      log = await SomaticLogModel.create({
        childId,
        authorId: session.userId,
        date: targetDate,
        sleepHours: sleepHours !== undefined ? Number(sleepHours) : 8,
        sleepQuality: sleepQuality || 'bueno',
        appetite: appetite || 'normal',
        physicalDiscomfort: physicalDiscomfort || 'ninguno',
        discomfortNotes: discomfortNotes || '',
        wellbeingNote: wellbeingNote || '',
        symptoms: symptoms || [],
        mood: mood || '',
        energyLevel: energyLevel || 'normal',
        supportsUsed: supportsUsed || [],
      });
    }

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'SOMATIC_LOG_SAVED',
      resource: 'SomaticLog',
      details: { sleepQuality, physicalDiscomfort, symptomsCount: symptoms?.length || 0, mood },
    });

    return NextResponse.json(
      { message: 'Registro somático y de factores guardado con éxito', log },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar registro somático';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
