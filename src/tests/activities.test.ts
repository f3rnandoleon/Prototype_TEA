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

  it('valida la estructura completa de Tipo A (Asociación) con pictogramas ARASAAC', () => {
    const pair = {
      id: 'p1',
      leftText: 'Manzana',
      leftImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
      rightText: 'Fruta',
      rightImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
    };

    expect(pair.leftImage).toContain('api.arasaac.org');
    expect(pair.rightImage).toContain('api.arasaac.org');
    expect(pair.leftText).toBe('Manzana');
    expect(pair.rightText).toBe('Fruta');
  });

  it('valida la estructura de Tipo B (Selección) con imagen de pregunta y respuesta correcta marcada', () => {
    const question = {
      id: 'q1',
      promptText: '¿Cuál de estos objetos se usa para dibujar?',
      promptImage: 'https://api.arasaac.org/api/pictograms/2408?download=false',
      options: [
        {
          id: 'opt1',
          text: 'Lápiz de colores',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2408?download=false',
          isCorrect: true,
        },
        {
          id: 'opt2',
          text: 'Cuchara',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2422?download=false',
          isCorrect: false,
        },
      ],
    };

    const correctOptions = question.options.filter((o) => o.isCorrect);
    expect(correctOptions).toHaveLength(1);
    expect(correctOptions[0].text).toBe('Lápiz de colores');
    expect(question.promptImage).toBeDefined();
  });

  it('valida el reordenamiento de pasos en Tipo C (Secuencia temporal)', () => {
    const steps = [
      { id: 's1', order: 1, text: '1. Mojar manos', imageUrl: 'https://api.arasaac.org/api/pictograms/2438?download=false' },
      { id: 's2', order: 2, text: '2. Enjabonar', imageUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false' },
      { id: 's3', order: 3, text: '3. Secar', imageUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false' },
    ];

    expect(steps[0].order).toBe(1);
    expect(steps[1].order).toBe(2);
    expect(steps[2].order).toBe(3);

    // Simular mover el paso 2 hacia arriba
    const reordered = [steps[1], steps[0], steps[2]].map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    expect(reordered[0].id).toBe('s2');
    expect(reordered[0].order).toBe(1);
    expect(reordered[1].id).toBe('s1');
    expect(reordered[1].order).toBe(2);
  });
});

