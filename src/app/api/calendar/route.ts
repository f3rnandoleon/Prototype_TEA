import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ScheduleEventModel } from '@/models/ScheduleEvent';
import { SomaticLogModel } from '@/models/SomaticLog';
import { BatteryLogModel } from '@/models/BatteryLog';
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
    const monthParam = req.nextUrl.searchParams.get('month'); // e.g., '2026-03'

    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    await connectDB();

    const child = await ChildModel.findById(childId);
    if (!child) {
      return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 });
    }

    // Calcular rango de fechas para el mes (incluyendo buffer de días previos y posteriores)
    let year: number;
    let month: number; // 0-indexed

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number);
      year = y;
      month = m - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startDate = new Date(year, month - 1, 20); // 10 días antes del mes
    const endDate = new Date(year, month + 1, 15); // 15 días después del mes

    // 1. Obtener eventos de agenda
    const events = await ScheduleEventModel.find({
      childId,
    }).sort({ date: 1, startTime: 1 });

    // 2. Obtener bitácora somática y síntomas
    const somaticLogs = await SomaticLogModel.find({
      childId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('authorId', 'name email role')
      .sort({ date: 1 });

    // 3. Obtener batería sensorial
    const batteryLogs = await BatteryLogModel.find({
      childId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: 1 });

    // 4. Analizar patrones reales detectados
    const patternInsights = [];

    // Patrón 1: Relación entre sueño y sensibilidad/malestar
    const poorSleepDays = somaticLogs.filter(
      (l) => (l.sleepQuality === 'inquieto' || (l.sleepHours && l.sleepHours < 7))
    );
    const poorSleepWithSensory = poorSleepDays.filter(
      (l) => l.symptoms && l.symptoms.some((s) => ['sensibilidad_ruido', 'sobrecarga_visual', 'molestia_estomago'].includes(s))
    );

    if (poorSleepDays.length > 0) {
      const ratio = Math.round((poorSleepWithSensory.length / poorSleepDays.length) * 100);
      patternInsights.push({
        type: 'correlation',
        title: 'Correlación Sueño y Sensibilidad',
        description: `En el ${ratio}% de los días con sueño inquieto o menor a 7 horas, se registraron aumentos en sensibilidad auditiva o molestia somática.`,
        icon: '🌙',
        severity: ratio > 50 ? 'warning' : 'info',
      });
    }

    // Patrón 2: Impacto de apoyos de regulación
    const daysWithCalmSupports = somaticLogs.filter(
      (l) => l.supportsUsed && l.supportsUsed.length > 0
    );
    if (daysWithCalmSupports.length > 0) {
      patternInsights.push({
        type: 'support',
        title: 'Eficacia de Apoyos y Rincón de Calma',
        description: `El uso de protectores auditivos y rincón de calma favoreció estados de tranquilidad en la mayoría de los registros.`,
        icon: '🌿',
        severity: 'success',
      });
    }

    // Patrón 3: Racha de bienestar basal
    let currentCalmStreak = 0;
    let maxCalmStreak = 0;
    somaticLogs.forEach((l) => {
      if (l.physicalDiscomfort === 'ninguno' && (l.mood === 'tranquilo' || l.mood === 'feliz' || !l.mood)) {
        currentCalmStreak++;
        if (currentCalmStreak > maxCalmStreak) maxCalmStreak = currentCalmStreak;
      } else {
        currentCalmStreak = 0;
      }
    });

    if (maxCalmStreak >= 2) {
      patternInsights.push({
        type: 'streak',
        title: 'Racha de Estabilidad Basal',
        description: `Se detectó una secuencia continua de ${maxCalmStreak} días en zona de alta regulación y bienestar físico.`,
        icon: '✨',
        severity: 'success',
      });
    }

    return NextResponse.json({
      child: {
        _id: child._id,
        name: child.name,
        nickname: child.nickname,
      },
      currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
      events,
      somaticLogs,
      batteryLogs,
      patternInsights,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar datos de calendario';
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
      symptoms,
      mood,
      sleepHours,
      sleepQuality,
      appetite,
      physicalDiscomfort,
      discomfortNotes,
      wellbeingNote,
      supportsUsed,
    } = body;

    if (!childId || !date) {
      return NextResponse.json({ error: 'childId y date son requeridos' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.create');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let log = await SomaticLogModel.findOne({
      childId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (log) {
      if (symptoms !== undefined) log.symptoms = symptoms;
      if (mood !== undefined) log.mood = mood;
      if (sleepHours !== undefined) log.sleepHours = Number(sleepHours);
      if (sleepQuality !== undefined) log.sleepQuality = sleepQuality;
      if (appetite !== undefined) log.appetite = appetite;
      if (physicalDiscomfort !== undefined) log.physicalDiscomfort = physicalDiscomfort;
      if (discomfortNotes !== undefined) log.discomfortNotes = discomfortNotes;
      if (wellbeingNote !== undefined) log.wellbeingNote = wellbeingNote;
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
        supportsUsed: supportsUsed || [],
      });
    }

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'CALENDAR_DAY_RECORDED',
      resource: 'SomaticLog',
      details: { date, symptoms, mood },
    });

    return NextResponse.json({
      message: 'Registro del día guardado con éxito',
      log,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar día en calendario';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
