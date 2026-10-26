import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { SomaticLogModel } from '@/models/SomaticLog';
import { BatteryLogModel } from '@/models/BatteryLog';
import { ABCLogModel } from '@/models/ABCLog';
import { ObservationModel } from '@/models/Observation';
import { authorizeChildAccess } from '@/lib/security/policies';

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

    // 1. Somatic logs
    const somaticLogs = await SomaticLogModel.find({ childId }).sort({ date: -1 }).limit(30);
    const validSleepHours = somaticLogs
      .filter((s) => s.sleepHours !== undefined && s.sleepHours !== null)
      .map((s) => s.sleepHours as number);
    const avgSleep = validSleepHours.length > 0
      ? Number((validSleepHours.reduce((a, b) => a + b, 0) / validSleepHours.length).toFixed(1))
      : null;

    const sleepQualityCounts: Record<string, number> = {
      muy_bueno: 0,
      bueno: 0,
      regular: 0,
      inquieto: 0,
    };
    somaticLogs.forEach((s) => {
      if (s.sleepQuality && sleepQualityCounts[s.sleepQuality] !== undefined) {
        sleepQualityCounts[s.sleepQuality]++;
      }
    });

    // 2. Battery logs
    const batteryLogs = await BatteryLogModel.find({ childId }).sort({ createdAt: -1 }).limit(50);
    const batteryCounts: Record<string, number> = {
      comodo: 0,
      cansado: 0,
      pausa: 0,
      sobrecarga: 0,
    };
    batteryLogs.forEach((b) => {
      if (batteryCounts[b.level] !== undefined) {
        batteryCounts[b.level]++;
      }
    });

    // 3. ABC logs
    const abcCount = await ABCLogModel.countDocuments({ childId });

    // 4. General observations
    const obsCount = await ObservationModel.countDocuments({ childId });

    return NextResponse.json({
      summary: {
        totalRecords: somaticLogs.length + batteryLogs.length + abcCount + obsCount,
        somatic: {
          totalLogs: somaticLogs.length,
          avgSleepHours: avgSleep,
          sleepQualityCounts,
        },
        sensoryBattery: {
          totalEntries: batteryLogs.length,
          distribution: batteryCounts,
        },
        abc: {
          totalLogs: abcCount,
        },
        disclaimer: 'Los datos son puramente descriptivos y de apoyo al acompañamiento. No implican causalidad automática ni reemplazan la evaluación clínica directa.',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener resumen de evolución';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
