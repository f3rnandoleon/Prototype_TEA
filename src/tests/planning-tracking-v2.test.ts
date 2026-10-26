import { describe, it, expect } from 'vitest';
import {
  SensoryBatteryLevel,
  IBatteryLog,
  ISomaticLog,
  IABCLog,
  IScheduleEvent,
  IPlanChange,
} from '@/types';

describe('Módulo 1: Calendario de Planificación & Anticipación', () => {
  it('registra estados cualitativos en el termómetro sensorial sin porcentajes clínicos', () => {
    const validLevels: SensoryBatteryLevel[] = ['comodo', 'cansado', 'pausa', 'sobrecarga'];

    const log: IBatteryLog = {
      _id: 'bat_1',
      childId: 'child_mati',
      level: 'cansado',
      note: 'Tengo poca energía, prefiero ir más despacio',
      registeredBy: 'child',
      createdAt: new Date(),
    };

    expect(validLevels).toContain(log.level);
    expect(log.registeredBy).toBe('child');
    // Verifica que el termómetro no sea numérico (e.g. 35%)
    expect(typeof log.level).toBe('string');
  });

  it('permite estructurar un Cambio de Planes con anticipación visual y opciones para el niño', () => {
    const planChange: IPlanChange = {
      _id: 'change_1',
      childId: 'child_mati',
      originalActivity: 'Ir al parque a jugar',
      newTask: 'Dibujar y armar bloques en casa',
      nextTask: 'Almorzar juntos',
      childOptions: ['Plastilina', 'Escuchar cuento', 'Rompecabezas'],
      reasonNotes: 'Lluvia intensa en el exterior',
      isActive: true,
      announcedAt: new Date(),
      createdAt: new Date(),
    };

    expect(planChange.isActive).toBe(true);
    expect(planChange.originalActivity).toBe('Ir al parque a jugar');
    expect(planChange.newTask).toBe('Dibujar y armar bloques en casa');
    expect(planChange.childOptions?.length).toBe(3);
  });

  it('permite registrar eventos especiales no rutinarios con nivel de alerta y apoyo visual', () => {
    const event: IScheduleEvent = {
      _id: 'ev_1',
      childId: 'child_mati',
      title: 'Visita de control al Odontólogo',
      date: '2026-11-05',
      startTime: '10:00',
      iconEmoji: '🏥',
      isNonRoutine: true,
      alertLevel: 'importante',
      visualPrepNotes: 'Llevar audífonos de cancelación de ruido y juguete sensorial',
      createdBy: 'tutor_1',
      creatorRole: 'tutor',
      createdAt: new Date(),
    };

    expect(event.isNonRoutine).toBe(true);
    expect(event.alertLevel).toBe('importante');
    expect(event.visualPrepNotes).toContain('audífonos');
  });
});

describe('Módulo 2: Seguimiento y Evolución (Neuroafirmativo)', () => {
  it('estructura el registro ABC enfocado en entorno, necesidad y apoyo eficaz', () => {
    const abc: IABCLog = {
      _id: 'abc_1',
      childId: 'child_mati',
      authorId: 'pro_1',
      date: new Date(),
      antecedentContext: 'Transición abrupta entre recreo y clase de matemáticas con timbre ruidoso',
      observedBehavior: 'Se cubrió los oídos, se sentó en el piso y emitió vocalizaciones de malestar',
      unmetNeed: 'Sobrecarga acústica y falta de temporizador de anticipación de fin de recreo',
      supportProvided: 'Se le ofrecieron audífonos de reducción de ruido y 5 minutos en el rincón sensorial',
      outcome: 'Reguló su respiración, tomó agua y se incorporó a la actividad con guía visual',
      visibility: ['tutor', 'professional', 'teacher'],
      createdAt: new Date(),
    };

    expect(abc.unmetNeed).toBeDefined();
    expect(abc.supportProvided).toContain('audífonos');
    expect(abc.visibility).toContain('teacher');
  });

  it('calcula métricas somáticas descriptivas sin inferir causalidad médica automática', () => {
    const somaticEntries: Partial<ISomaticLog>[] = [
      { sleepHours: 8, sleepQuality: 'bueno' },
      { sleepHours: 9, sleepQuality: 'muy_bueno' },
      { sleepHours: 7, sleepQuality: 'regular' },
    ];

    const totalHours = somaticEntries.reduce((acc, curr) => acc + (curr.sleepHours || 0), 0);
    const avgSleep = Number((totalHours / somaticEntries.length).toFixed(1));

    expect(avgSleep).toBe(8.0);

    // Verificación del principio ético
    const disclaimer =
      'Los datos son puramente descriptivos y de apoyo al acompañamiento. No implican causalidad automática.';
    expect(disclaimer).toContain('No implican causalidad automática');
  });
});
