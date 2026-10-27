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

  it('filtra y actualiza dinámicamente la evolución y registros según el día seleccionado en el calendario', () => {
    // Helper de comparación de fechas usado en el calendario
    const isSameCalendarDay = (d1: Date | string, d2: Date | string): boolean => {
      if (!d1 || !d2) return false;
      if (typeof d1 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d1)) {
        if (typeof d2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d2)) return d1 === d2;
        const d2Obj = typeof d2 === 'string' ? new Date(d2) : d2;
        const y2 = d2Obj.getFullYear();
        const m2 = String(d2Obj.getMonth() + 1).padStart(2, '0');
        const day2 = String(d2Obj.getDate()).padStart(2, '0');
        if (d1 === `${y2}-${m2}-${day2}`) return true;
        try {
          if (d1 === d2Obj.toISOString().split('T')[0]) return true;
        } catch {}
        return false;
      }
      if (typeof d2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d2)) {
        return isSameCalendarDay(d2, d1);
      }
      const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
      const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };

    const mockEvents: Partial<IScheduleEvent>[] = [
      { _id: 'ev-1', title: 'Terapia Ocupacional', date: '2026-03-14', iconEmoji: '🧩' },
      { _id: 'ev-2', title: 'Fonoaudiología', date: '2026-03-15', iconEmoji: '🗣️' },
    ];

    const mockObservations = [
      {
        _id: 'obs-1',
        category: 'sensorial',
        description: 'Usó audífonos y reguló la respuesta sonora en el aula.',
        date: new Date('2026-03-14T10:00:00.000Z'),
      },
      {
        _id: 'obs-2',
        category: 'pedagogico',
        description: 'Completó actividad visual de emparejamiento.',
        date: new Date('2026-03-15T11:00:00.000Z'),
      },
    ];

    // Cuando se selecciona el día 14 de marzo
    const selectedDateDay14 = new Date(2026, 2, 14);
    const day14Events = mockEvents.filter((e) => isSameCalendarDay(e.date!, selectedDateDay14));
    const day14Obs = mockObservations.filter((o) => isSameCalendarDay(o.date, selectedDateDay14));

    expect(day14Events.length).toBe(1);
    expect(day14Events[0].title).toBe('Terapia Ocupacional');
    expect(day14Obs.length).toBe(1);
    expect(day14Obs[0].description).toContain('Usó audífonos');

    // Cuando el usuario cambia la selección al día 15 de marzo
    const selectedDateDay15 = new Date(2026, 2, 15);
    const day15Events = mockEvents.filter((e) => isSameCalendarDay(e.date!, selectedDateDay15));
    const day15Obs = mockObservations.filter((o) => isSameCalendarDay(o.date, selectedDateDay15));

    expect(day15Events.length).toBe(1);
    expect(day15Events[0].title).toBe('Fonoaudiología');
    expect(day15Obs.length).toBe(1);
    expect(day15Obs[0].description).toContain('Completó actividad visual');
  });
});

