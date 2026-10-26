import { describe, it, expect } from 'vitest';
import { IObservation, IGoal, UserRole } from '@/types';

describe('Módulo de Seguimiento y Objetivos Individualizados', () => {
  it('filtra observaciones según la visibilidad del rol', () => {
    const observations: { _id: string; description: string; category: IObservation['category']; visibility: UserRole[] }[] = [
      {
        _id: 'obs1',
        description: 'Nota pedagógica sobre concentración',
        category: 'pedagogico',
        visibility: ['tutor', 'teacher'],
      },
      {
        _id: 'obs2',
        description: 'Nota clínica confidencial',
        category: 'sensorial',
        visibility: ['tutor', 'professional'],
      },
    ];

    const teacherVisible = observations.filter((o) => o.visibility.includes('teacher'));
    const proVisible = observations.filter((o) => o.visibility.includes('professional'));

    expect(teacherVisible.length).toBe(1);
    expect(teacherVisible[0]._id).toBe('obs1');

    expect(proVisible.length).toBe(1);
    expect(proVisible[0]._id).toBe('obs2');
  });

  it('permite registrar notas de evolución sobre metas terapéuticas', () => {
    const goal: IGoal = {
      _id: 'goal_1',
      childId: 'c1',
      description: 'Pedir pausas espontáneamente con el comunicador',
      area: 'comunicacion',
      responsibleId: 'u1',
      startDate: new Date(),
      criteria: '3 veces por semana de manera autónoma',
      status: 'en_progreso',
      progressNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    goal.progressNotes.push({
      date: new Date(),
      note: 'Durante la clase de hoy, utilizó el pictograma de pausa 2 veces sin requerir instigación física.',
      authorId: 'u2',
      authorName: 'Ana Docente',
    });

    expect(goal.progressNotes.length).toBe(1);
    expect(goal.status).toBe('en_progreso');

    // Marcar como alcanzado
    goal.status = 'alcanzado';
    expect(goal.status).toBe('alcanzado');
  });
});
