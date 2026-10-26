import { describe, it, expect, beforeEach } from 'vitest';
import { defaultCategories, defaultQuickAccessItems, defaultVocabularyItems } from '@/features/aac/defaultVocabulary';
import { saveBoardLocally, loadBoardLocally } from '@/features/aac/offlineStorage';
import { IAACBoard } from '@/types';

describe('Módulo SAAC y Vocabulario Inicial', () => {
  it('incluye las 9 categorías esenciales requeridas', () => {
    const categoryIds = defaultCategories.map((c) => c.id);
    expect(categoryIds).toContain('necesidades');
    expect(categoryIds).toContain('personas');
    expect(categoryIds).toContain('comida');
    expect(categoryIds).toContain('lugares');
    expect(categoryIds).toContain('actividades');
    expect(categoryIds).toContain('emociones');
    expect(categoryIds).toContain('acciones');
    expect(categoryIds).toContain('respuestas');
    expect(categoryIds).toContain('ayuda');
  });

  it('proporciona acceso directo y permanente a las 8 expresiones críticas', () => {
    const quickLabels = defaultQuickAccessItems.map((item) => item.label);
    expect(quickLabels).toContain('Sí');
    expect(quickLabels).toContain('No');
    expect(quickLabels).toContain('Quiero');
    expect(quickLabels).toContain('No quiero');
    expect(quickLabels).toContain('Ayuda');
    expect(quickLabels).toContain('Para');
    expect(quickLabels).toContain('Me duele');
    expect(quickLabels).toContain('Necesito descansar');
  });

  it('guarda y recupera tableros en caché local para soporte offline', () => {
    // Mock de localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
    };
    Object.defineProperty(global, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true,
    });
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    const mockBoard: IAACBoard = {
      _id: 'board_test_1',
      childId: 'child_123',
      name: 'Tablero de Mateo',
      isCustom: true,
      columnsCount: 4,
      categories: defaultCategories,
      items: defaultVocabularyItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveBoardLocally('child_123', mockBoard);
    const loaded = loadBoardLocally('child_123');

    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Tablero de Mateo');
    expect(loaded?.items.length).toBe(defaultVocabularyItems.length);
  });
});
