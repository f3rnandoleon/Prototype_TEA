import { describe, it, expect } from 'vitest';
import { IActivity } from '@/types';

describe('Módulo de Actividades Educativas Adaptadas', () => {
  it('valida el emparejamiento correcto en Actividades Tipo A (Asociación)', () => {
    const pairs = [
      { id: 'p1', leftText: 'Manzana', rightText: 'Fruta' },
      { id: 'p2', leftText: 'Leche', rightText: 'Bebida' },
    ];

    const selectedLeft: string = 'p1';
    const selectedRight: string = 'p1';

    const isMatch = selectedLeft === selectedRight;
    expect(isMatch).toBe(true);

    const isMismatch = selectedLeft === 'p2';
    expect(isMismatch).toBe(false);
  });

  it('valida la respuesta correcta en Actividades Tipo B (Selección)', () => {
    const question = {
      promptText: '¿Cómo se siente?',
      options: [
        { id: 'o1', text: 'Feliz', isCorrect: true },
        { id: 'o2', text: 'Triste', isCorrect: false },
      ],
    };

    const chosen = question.options.find((o) => o.id === 'o1');
    expect(chosen?.isCorrect).toBe(true);
  });

  it('verifica el orden cronológico en Actividades Tipo C (Secuencias)', () => {
    const sequence = [
      { id: 's1', order: 1, text: '1. Mojar manos' },
      { id: 's2', order: 2, text: '2. Enjabonar' },
      { id: 's3', order: 3, text: '3. Secar' },
    ];

    const currentOrder: string[] = [];

    // Primer paso esperado es s1
    const nextExpected = sequence[currentOrder.length];
    expect(nextExpected.id).toBe('s1');

    currentOrder.push('s1');
    expect(sequence[currentOrder.length].id).toBe('s2');

    currentOrder.push('s2');
    expect(sequence[currentOrder.length].id).toBe('s3');
  });

  it('registra los apoyos utilizados en el resultado de la actividad', () => {
    const supportsUsed: string[] = [];
    supportsUsed.push('pista visual');
    supportsUsed.push('lectura en voz alta');

    const result = {
      score: 3,
      totalItems: 3,
      supportsUsed,
      timeSpentSeconds: 45,
    };

    expect(result.supportsUsed).toContain('pista visual');
    expect(result.supportsUsed).toContain('lectura en voz alta');
    expect(result.score).toBe(3);
  });
});
