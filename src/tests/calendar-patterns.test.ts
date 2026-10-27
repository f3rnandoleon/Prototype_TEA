import { describe, it, expect } from 'vitest';
import { IScheduleEvent, ISomaticLog } from '@/types';

describe('Módulo de Calendario y Detección de Patrones Sensoriales', () => {
  it('soporta eventos de agenda con estilo floral scalloped (como día 14 en la muestra)', () => {
    const flowerEvent: IScheduleEvent = {
      _id: 'ev-flower-1',
      childId: 'child_1',
      title: 'Fonoaudiología y Lenguaje',
      date: '2026-03-14',
      iconEmoji: '🌸',
      isNonRoutine: true,
      alertLevel: 'informativo',
      badgeStyle: 'flower',
      badgeColor: 'purple',
      badgeLabel: 'TERAPIA',
      createdBy: 'user_1',
      createdAt: new Date(),
    };

    expect(flowerEvent.badgeStyle).toBe('flower');
    expect(flowerEvent.badgeColor).toBe('purple');
    expect(flowerEvent.badgeLabel).toBe('TERAPIA');
    expect(flowerEvent.date).toBe('2026-03-14');
  });

  it('soporta períodos continuos (rachas / streak pills) que abarcan varios días', () => {
    const streakEvent: IScheduleEvent = {
      _id: 'ev-streak-1',
      childId: 'child_1',
      title: 'Período de Sensibilidad Auditiva',
      date: '2026-03-02',
      endDate: '2026-03-06',
      iconEmoji: '🎧',
      isNonRoutine: true,
      alertLevel: 'importante',
      badgeStyle: 'pill',
      badgeColor: 'rose',
      badgeLabel: 'SENSIBLE',
      createdBy: 'user_1',
      createdAt: new Date(),
    };

    expect(streakEvent.badgeStyle).toBe('pill');
    expect(streakEvent.badgeColor).toBe('rose');
    expect(streakEvent.endDate).toBeDefined();
    expect(streakEvent.endDate! >= streakEvent.date).toBe(true);
  });

  it('permite registrar síntomas, factores y estado de ánimo diario en la bitácora somática', () => {
    const dailyLog: ISomaticLog = {
      _id: 'som-1',
      childId: 'child_1',
      authorId: 'user_1',
      date: new Date('2026-03-12'),
      sleepHours: 6.5,
      sleepQuality: 'inquieto',
      symptoms: ['molestia_estomago', 'insomnio', 'sensibilidad_ruido'],
      mood: 'ansioso',
      supportsUsed: ['auriculares_canceladores', 'rincon_calma'],
      wellbeingNote: 'Día con mayor requerimiento de pausas sensoriales.',
      createdAt: new Date(),
    };

    expect(dailyLog.symptoms).toContain('molestia_estomago');
    expect(dailyLog.symptoms).toContain('sensibilidad_ruido');
    expect(dailyLog.mood).toBe('ansioso');
    expect(dailyLog.supportsUsed).toContain('auriculares_canceladores');
  });

  it('detecta correlaciones entre sueño deficiente y sensibilidad sensorial', () => {
    const logs: Partial<ISomaticLog>[] = [
      {
        date: '2026-03-02',
        sleepQuality: 'inquieto',
        sleepHours: 6,
        symptoms: ['sensibilidad_ruido', 'molestia_estomago'],
        mood: 'ansioso',
      },
      {
        date: '2026-03-03',
        sleepQuality: 'bueno',
        sleepHours: 8.5,
        symptoms: [],
        mood: 'tranquilo',
      },
      {
        date: '2026-03-04',
        sleepQuality: 'inquieto',
        sleepHours: 5.5,
        symptoms: ['sensibilidad_ruido'],
        mood: 'abrumado',
      },
    ];

    const poorSleepDays = logs.filter(
      (l) => l.sleepQuality === 'inquieto' || (l.sleepHours && l.sleepHours < 7)
    );
    const poorSleepWithSensory = poorSleepDays.filter(
      (l) => l.symptoms && l.symptoms.includes('sensibilidad_ruido')
    );

    expect(poorSleepDays.length).toBe(2);
    expect(poorSleepWithSensory.length).toBe(2);

    const correlationRatio = Math.round((poorSleepWithSensory.length / poorSleepDays.length) * 100);
    expect(correlationRatio).toBe(100);
  });
});
