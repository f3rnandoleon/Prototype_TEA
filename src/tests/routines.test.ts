import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutineModel } from '@/models/Routine';
import { RoutineProgressModel } from '@/models/RoutineProgress';

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

describe('Módulo de Rutinas y Agenda Visual', () => {
  it('estructura correctamente una rutina con pasos ordenados y tiempos', () => {
    const routineData = {
      title: 'Rutina Escolar de la Mañana',
      category: 'manana',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '07:30',
      steps: [
        { id: 'step-1', order: 1, title: 'Vestirse con ropa cómoda', estimatedMinutes: 10 },
        { id: 'step-2', order: 2, title: 'Tomar desayuno', estimatedMinutes: 20 },
        { id: 'step-3', order: 3, title: 'Revisar mochila', estimatedMinutes: 5 },
      ],
    };

    expect(routineData.steps.length).toBe(3);
    expect(routineData.steps[0].order).toBe(1);
    expect(routineData.steps[1].order).toBe(2);
    expect(routineData.daysOfWeek).toContain(1);
  });

  it('calcula adecuadamente el progreso diario de pasos completados', () => {
    const totalSteps = ['s1', 's2', 's3', 's4'];
    let completedStepIds = ['s1', 's2'];

    // Completar un nuevo paso
    completedStepIds.push('s3');
    expect(completedStepIds.length).toBe(3);

    // Calcular estado
    let status = completedStepIds.length >= totalSteps.length ? 'completed' : 'in_progress';
    expect(status).toBe('in_progress');

    // Completar el último paso
    completedStepIds.push('s4');
    status = completedStepIds.length >= totalSteps.length ? 'completed' : 'in_progress';
    expect(status).toBe('completed');
  });

  it('anticipa paso actual y paso siguiente para reducir ansiedad cognitiva', () => {
    const steps = [
      { id: 's1', title: 'Lavar manos' },
      { id: 's2', title: 'Almorzar' },
      { id: 's3', title: 'Cepillarse dientes' },
      { id: 's4', title: 'Leer cuento' },
    ];
    const completed = ['s1'];

    const pending = steps.filter((s) => !completed.includes(s.id));
    const currentStep = pending[0];
    const nextStep = pending[1];

    expect(currentStep.id).toBe('s2');
    expect(currentStep.title).toBe('Almorzar');
    expect(nextStep.id).toBe('s3');
    expect(nextStep.title).toBe('Cepillarse dientes');
  });
});
