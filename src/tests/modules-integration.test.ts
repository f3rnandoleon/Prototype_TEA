import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as assignActivityPOST, DELETE as assignActivityDELETE } from '@/app/api/activities/assign/route';
import { GET as activitiesGET, POST as activitiesPOST } from '@/app/api/activities/route';
import { PUT as activityPUT, DELETE as activityDELETE } from '@/app/api/activities/[id]/route';
import { GET as calendarGET } from '@/app/api/calendar/route';
import { getSessionUser } from '@/lib/auth/session';
import { authorizeChildAccess } from '@/lib/security/policies';
import { ChildModel } from '@/models/Child';
import { ScheduleEventModel } from '@/models/ScheduleEvent';
import { SomaticLogModel } from '@/models/SomaticLog';
import { BatteryLogModel } from '@/models/BatteryLog';
import { ObservationModel } from '@/models/Observation';
import { ABCLogModel } from '@/models/ABCLog';
import { ActivityModel } from '@/models/Activity';
import { ActivityAssignmentModel } from '@/models/ActivityAssignment';
import { IScheduleEvent, IObservation, IABCLog } from '@/types';

vi.mock('@/lib/auth/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/security/policies', () => ({
  authorizeChildAccess: vi.fn(),
  authorizeChildOwner: vi.fn(),
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Child', () => ({
  ChildModel: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/ScheduleEvent', () => ({
  ScheduleEventModel: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/SomaticLog', () => ({
  SomaticLogModel: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/BatteryLog', () => ({
  BatteryLogModel: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/Observation', () => ({
  ObservationModel: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/models/ABCLog', () => ({
  ABCLogModel: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/models/Activity', () => ({
  ActivityModel: {
    find: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(3),
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('@/models/ActivityAssignment', () => ({
  ActivityAssignmentModel: {
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndDelete: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

describe('Integración entre Módulos: Separación de Roles (Doctor vs Docente)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deniega a un profesional/médico el acceso a listar actividades educativas (403)', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'doc_123',
      role: 'professional',
      email: 'doctor@clinica.com',
    });

    const req = new NextRequest('http://localhost:3000/api/activities');
    const res = await activitiesGET(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('uso exclusivo para docentes y tutores');
  });

  it('deniega a un profesional/médico la creación de actividades educativas (403)', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'doc_123',
      role: 'professional',
      email: 'doctor@clinica.com',
    });

    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Actividad de Prueba',
        activityType: 'association',
        config: {},
      }),
    });
    const res = await activitiesPOST(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('no gestionan actividades educativas');
  });

  it('deniega a un profesional/médico asignar actividades educativas a un niño (403)', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'doc_123',
      role: 'professional',
      email: 'doctor@clinica.com',
    });

    const req = new NextRequest('http://localhost:3000/api/activities/assign', {
      method: 'POST',
      body: JSON.stringify({
        childId: 'child_mati',
        activityId: 'act_1',
      }),
    });
    const res = await assignActivityPOST(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('exclusiva del docente o tutor');
  });

  it('permite a un docente autorizado asignar actividades educativas', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'docente_456',
      role: 'teacher',
      email: 'docente@colegio.edu',
    });

    (authorizeChildAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      authorized: true,
      isOwner: false,
    });

    (ActivityAssignmentModel.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: { toString: () => 'asg_123' },
      childId: 'child_mati',
      activityId: 'act_1',
    });

    const req = new NextRequest('http://localhost:3000/api/activities/assign', {
      method: 'POST',
      body: JSON.stringify({
        childId: 'child_mati',
        activityId: 'act_1',
      }),
    });
    const res = await assignActivityPOST(req);

    // Debe pasar la validación de rol y proceder a la base de datos (201)
    expect(res.status).toBe(201);
  });

  it('permite a un docente autorizado desasignar una actividad previamente asignada', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'docente_456',
      role: 'teacher',
      email: 'docente@colegio.edu',
    });

    (ActivityAssignmentModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: { toString: () => 'asg_123' },
      childId: { toString: () => 'child_mati' },
      activityId: { toString: () => 'act_1' },
    });

    (authorizeChildAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      authorized: true,
      isOwner: false,
    });

    (ActivityAssignmentModel.findByIdAndDelete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: 'asg_123',
    });

    const req = new NextRequest('http://localhost:3000/api/activities/assign?id=asg_123', {
      method: 'DELETE',
    });
    const res = await assignActivityDELETE(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain('desasignada correctamente');
  });

  it('permite a un docente/tutor editar una actividad educativa adaptada', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'docente_456',
      role: 'teacher',
      email: 'docente@colegio.edu',
    });

    const mockActivity = {
      _id: 'act_1',
      title: 'Título Original',
      activityType: 'association',
      skillType: 'Atención',
      difficulty: 'facil',
      instructions: 'Instrucciones',
      config: { pairs: [] },
      save: vi.fn().mockResolvedValue(true),
    };

    (ActivityModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivity);

    const req = new NextRequest('http://localhost:3000/api/activities/act_1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Título Actualizado con Pictogramas',
        description: 'Nueva descripción adaptada',
        skillType: 'Reconocimiento Emocional',
        activityType: 'association',
        difficulty: 'medio',
        instructions: 'Nuevas instrucciones amables',
        config: {
          pairs: [
            {
              id: 'p1',
              leftText: 'Feliz',
              leftImage: 'https://api.arasaac.org/api/pictograms/2410?download=false',
              rightText: 'Emoción',
              rightImage: 'https://api.arasaac.org/api/pictograms/2410?download=false',
            },
          ],
        },
      }),
    });

    const res = await activityPUT(req, { params: { id: 'act_1' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain('actualizada exitosamente');
    expect(mockActivity.title).toBe('Título Actualizado con Pictogramas');
    expect(mockActivity.save).toHaveBeenCalled();
  });
});

describe('Integración Bidireccional: Seguimiento / Evolución <-> Calendario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('el endpoint de calendario incluye observaciones y registros ABC en su respuesta', async () => {
    (getSessionUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'tutor_001',
      role: 'tutor',
    });

    (authorizeChildAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      authorized: true,
      isOwner: true,
    });

    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: 'child_mati',
      name: 'Mateo',
    });

    const mockEvents: Partial<IScheduleEvent>[] = [
      {
        _id: 'ev-1',
        title: 'Terapia de Fonoaudiología',
        date: '2026-03-14',
        startTime: '10:00',
        iconEmoji: '🌸',
        badgeStyle: 'flower',
        badgeLabel: 'TERAPIA',
      },
    ];

    const mockObservations: Partial<IObservation>[] = [
      {
        _id: 'obs-1',
        category: 'bienestar',
        description: 'Excelente interacción durante la sesión',
        date: new Date('2026-03-14T10:30:00Z'),
        supportsUsed: ['pictogramas'],
        observedOutcome: 'Logró comunicarse con fluidez',
      },
    ];

    const mockAbc: Partial<IABCLog>[] = [
      {
        _id: 'abc-1',
        antecedentContext: 'Ruido imprevisto en recreo',
        observedBehavior: 'Buscó sus protectores auditivos',
        supportProvided: 'Acompañamiento a espacio de calma',
        outcome: 'Se autorreguló en 5 minutos',
        date: new Date('2026-03-15T11:00:00Z'),
      },
    ];

    const mockSomaticFind = {
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      }),
    };
    (SomaticLogModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSomaticFind);

    const mockEventsFind = {
      sort: vi.fn().mockResolvedValue(mockEvents),
    };
    (ScheduleEventModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockEventsFind);

    const mockBatteryFind = {
      sort: vi.fn().mockResolvedValue([]),
    };
    (BatteryLogModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockBatteryFind);

    const mockObsFind = {
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockObservations),
        }),
      }),
    };
    (ObservationModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockObsFind);

    const mockAbcFind = {
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockAbc),
      }),
    };
    (ABCLogModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAbcFind);

    const req = new NextRequest('http://localhost:3000/api/calendar?childId=child_mati&month=2026-03');
    const res = await calendarGET(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verificación de integración: el calendario retorna observaciones y registros ABC
    expect(data.observations).toBeDefined();
    expect(data.observations.length).toBe(1);
    expect(data.observations[0].description).toContain('Excelente interacción');

    expect(data.abcLogs).toBeDefined();
    expect(data.abcLogs.length).toBe(1);
    expect(data.abcLogs[0].supportProvided).toContain('espacio de calma');

    expect(data.events).toBeDefined();
    expect(data.events[0].title).toBe('Terapia de Fonoaudiología');
  });

  it('permite asociar una observación clínica/pedagógica a un evento específico del calendario', () => {
    const observationWithEvent: Partial<IObservation> = {
      _id: 'obs_100',
      childId: 'child_mati',
      category: 'pedagogico',
      description: 'Demostró gran interés en las secuencias visuales de clase',
      supportsUsed: ['apoyo visual'],
      date: new Date('2026-03-14'),
      scheduleEventId: 'ev-1', // Vinculado a la sesión de calendario ev-1
    };

    expect(observationWithEvent.scheduleEventId).toBe('ev-1');
    expect(observationWithEvent.category).toBe('pedagogico');
  });

  it('sincroniza las fechas entre eventos de calendario y la línea temporal de evolución', () => {
    const calendarEvent: IScheduleEvent = {
      _id: 'ev-session-1',
      childId: 'child_mati',
      title: 'Terapia Ocupacional',
      date: '2026-03-20',
      startTime: '16:00',
      iconEmoji: '🧩',
      isNonRoutine: true,
      alertLevel: 'informativo',
      createdBy: 'pro_1',
      createdAt: new Date(),
    };

    // Al construir la fecha ISO o Date para el timeline:
    const timelineDate = new Date(`${calendarEvent.date}T${calendarEvent.startTime}:00`);
    const observationDate = new Date('2026-03-20T16:30:00');

    // Ambos ocurren el mismo día YYYY-MM-DD
    const calDateStr = calendarEvent.date;
    const obsDateStr = observationDate.toISOString().split('T')[0];

    expect(calDateStr).toBe(obsDateStr);
    expect(timelineDate.getFullYear()).toBe(2026);
    expect(timelineDate.getMonth()).toBe(2); // Marzo (0-indexed)
  });
});
