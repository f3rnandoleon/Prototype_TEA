'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Trash2,
  RotateCcw,
  Sparkles,
  Plus,
  ArrowLeft,
  HeartHandshake,
  WifiOff,
  Folder,
} from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { PictogramCard } from '@/components/child/PictogramCard';
import { Button } from '@/components/ui/Button';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { saveBoardLocally, loadBoardLocally } from '@/features/aac/offlineStorage';
import { IAACBoard, IAACCategory, IAACItem, IChild } from '@/types';
import { defaultCategories, defaultQuickAccessItems, defaultVocabularyItems } from '@/features/aac/defaultVocabulary';

interface AACPageProps {
  params: {
    childId: string;
  };
}

export default function AACCommunicatorPage({ params }: AACPageProps) {
  const { childId } = params;
  const [child, setChild] = useState<IChild | null>(null);
  const [board, setBoard] = useState<IAACBoard | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('necesidades');
  const [messageStrip, setMessageStrip] = useState<IAACItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Formulario nuevo pictograma personalizado
  const [customLabel, setCustomLabel] = useState('');
  const [customAudioText, setCustomAudioText] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('necesidades');

  const { speak, isSpeaking, stop } = useSpeechSynthesis({
    rate: child?.accessibility?.voiceSpeed || 0.9,
    lang: 'es-ES',
  });

  useEffect(() => {
    // 1. Cargar configuración del niño
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      })
      .catch(() => setIsOffline(true));

    // 2. Cargar tablero SAAC (desde API o desde caché local offline)
    fetch(`/api/aac/boards?childId=${childId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar online');
        return res.json();
      })
      .then((data) => {
        if (data.board) {
          setBoard(data.board);
          saveBoardLocally(childId, data.board);
        }
      })
      .catch(() => {
        setIsOffline(true);
        const cached = loadBoardLocally(childId);
        if (cached) {
          setBoard(cached);
        } else {
          // Fallback predeterminado en memoria
          setBoard({
            _id: 'local_board',
            name: 'Tablero Local',
            isCustom: false,
            columnsCount: 4,
            categories: defaultCategories,
            items: defaultVocabularyItems,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
  }, [childId]);

  // Agregar pictograma a la frase
  const handleSelectItem = (item: IAACItem) => {
    setMessageStrip((prev) => [...prev, item]);
    // Feedback de audio inmediato por pictograma
    if (child?.accessibility?.soundEnabled !== false) {
      speak(item.audioText || item.label);
    }
  };

  // Reproducir la frase completa construida
  const handleSpeakPhrase = () => {
    if (messageStrip.length === 0) return;
    const phrase = messageStrip.map((item) => item.audioText || item.label).join(' ');
    speak(phrase);
  };

  // Borrar último pictograma
  const handleRemoveLast = () => {
    setMessageStrip((prev) => prev.slice(0, -1));
  };

  // Limpiar toda la frase
  const handleClearStrip = () => {
    stop();
    setMessageStrip([]);
  };

  // Guardar nuevo pictograma personalizado
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim()) return;

    const newItem: IAACItem = {
      id: `custom-${Date.now()}`,
      categoryId: customCategory,
      label: customLabel,
      audioText: customAudioText || customLabel,
      imageUrl: customImageUrl || 'https://api.arasaac.org/api/pictograms/6175?download=false',
      order: 999,
    };

    // Actualizar estado local
    if (board) {
      const updatedBoard = {
        ...board,
        items: [...board.items, newItem],
      };
      setBoard(updatedBoard);
      saveBoardLocally(childId, updatedBoard);
    }

    // Persistir en backend si hay conexión
    try {
      await fetch('/api/aac/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          newItem,
        }),
      });
    } catch {
      // Si falla, ya está guardado en localStorage
    }

    setShowAddCustomModal(false);
    setCustomLabel('');
    setCustomAudioText('');
    setCustomImageUrl('');
  };

  const categories = board?.categories || defaultCategories;
  const items = board?.items || defaultVocabularyItems;
  const currentCategoryItems = items.filter((item) => item.categoryId === activeCategory);
  const quickAccessItems = items.filter((item) => item.isQuickAccess) || defaultQuickAccessItems;
  const columnsCount = board?.columnsCount || child?.accessibility?.columnsCount || 4;

  const gridColsClass =
    columnsCount === 2
      ? 'grid-cols-2'
      : columnsCount === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : columnsCount === 6
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  const buttonSize = child?.accessibility?.buttonSize || 'large';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <ChildHeader
        childName={child?.nickname || child?.name || 'Amigo'}
        childId={childId}
        currentSectionTitle="Comunicador SAAC"
      />

      {/* Indicador de modo offline si aplica */}
      {isOffline && (
        <div className="bg-amber-100 text-amber-900 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b border-amber-200">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo sin conexión: Tu comunicador visual funciona normalmente desde la memoria local</span>
        </div>
      )}

      {/* 1. TIRA DE CONSTRUCCIÓN DE MENSAJE (SUPERIOR) */}
      <section
        aria-label="Tira de mensaje construido"
        className="sticky top-[4.5rem] z-30 bg-white border-b-4 border-slate-300 p-3 sm:p-4 shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          {/* Contenedor de pictogramas en la frase */}
          <div className="flex-1 w-full flex items-center gap-2 overflow-x-auto min-h-[5.5rem] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-2 px-3">
            {messageStrip.length === 0 ? (
              <span className="text-slate-400 font-bold text-sm sm:text-base mx-auto select-none">
                Toca los pictogramas para construir tu frase
              </span>
            ) : (
              messageStrip.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex-shrink-0 flex flex-col items-center justify-center bg-white border-2 border-emerald-500 rounded-xl p-1.5 shadow-sm min-w-[4rem] sm:min-w-[4.5rem]"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] font-black text-slate-800 line-clamp-1 mt-0.5">
                    {item.label}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Botones de acción de la tira: HABLAR, BORRAR ÚLTIMO, LIMPIAR */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={handleSpeakPhrase}
              disabled={messageStrip.length === 0}
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-3 px-5 rounded-2xl gap-2 shadow-md disabled:opacity-40"
              aria-label="Leer la frase en voz alta"
            >
              <Volume2 className="w-6 h-6" />
              <span>Decir Frase</span>
            </Button>

            <button
              onClick={handleRemoveLast}
              disabled={messageStrip.length === 0}
              className="p-3 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 font-bold transition-all shadow-sm"
              title="Borrar el último elemento"
              aria-label="Borrar último pictograma"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleClearStrip}
              disabled={messageStrip.length === 0}
              className="p-3 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-30 font-bold transition-all shadow-sm"
              title="Limpiar toda la frase"
              aria-label="Limpiar frase completa"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. BOTONERA DE ACCESO PERMANENTE Y RÁPIDO */}
      <section
        aria-label="Expresiones de acceso rápido permanente"
        className="bg-emerald-50/80 border-b-2 border-emerald-200 py-2.5 px-4 overflow-x-auto shadow-inner"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          <span className="text-xs font-black uppercase text-emerald-900 mr-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Rápido:</span>
          </span>

          {quickAccessItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border-2 border-emerald-400 hover:bg-emerald-100 active:scale-95 shadow-sm text-slate-800 font-black text-sm sm:text-base transition-all"
            >
              <img
                src={item.imageUrl}
                alt=""
                className="w-6 h-6 object-contain pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. CATEGORÍAS NAVEGABLES */}
      <nav
        aria-label="Categorías de pictogramas"
        className="bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all border-2 ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md scale-105'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-all ml-2"
            title="Añadir pictograma personalizado"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </nav>

      {/* 4. GRILLA PRINCIPAL DE PICTOGRAMAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentCategoryItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 font-bold">
            No hay pictogramas en esta categoría. Puedes agregar uno nuevo con el botón "+ Agregar".
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-3 sm:gap-4 lg:gap-5`}>
            {currentCategoryItems.map((item) => (
              <PictogramCard
                key={item.id}
                item={item}
                onClick={handleSelectItem}
                size={buttonSize}
                showVoiceIcon
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL: Agregar Pictograma Personalizado */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Nuevo Pictograma Personalizado</h2>
            <p className="text-xs text-slate-500 mb-4">
              Agrega una palabra o imagen adaptada a los intereses del niño.
            </p>

            <form onSubmit={handleAddCustomItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Texto del Pictograma (Nombre)
                </label>
                <input
                  type="text"
                  required
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Ej. Mi manta favorita"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Texto al Hablar (Audio)
                </label>
                <input
                  type="text"
                  value={customAudioText}
                  onChange={(e) => setCustomAudioText(e.target.value)}
                  placeholder="Ej. Quiero mi manta favorita por favor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  URL de Imagen (o foto subida)
                </label>
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoría
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddCustomModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Guardar Pictograma
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
