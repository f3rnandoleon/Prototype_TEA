import { IAACBoard } from '@/types';

const AAC_STORAGE_KEY_PREFIX = 'tea_aac_board_';

export function saveBoardLocally(childId: string, board: IAACBoard): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${AAC_STORAGE_KEY_PREFIX}${childId}`, JSON.stringify(board));
  } catch (e) {
    console.warn('No se pudo guardar el tablero SAAC en caché local:', e);
  }
}

export function loadBoardLocally(childId: string): IAACBoard | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${AAC_STORAGE_KEY_PREFIX}${childId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error al leer el tablero SAAC desde caché local:', e);
    return null;
  }
}
