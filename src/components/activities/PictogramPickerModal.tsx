'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PictogramPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, label?: string) => void;
  title?: string;
}

interface ArasaacSearchResult {
  _id: number;
  keywords: Array<{ keyword: string }>;
}

const PRESET_CATEGORIES = [
  {
    name: 'Emociones',
    items: [
      { id: 2410, label: 'Feliz' },
      { id: 2413, label: 'Triste' },
      { id: 2407, label: 'Enojado' },
      { id: 2418, label: 'Sorprendido' },
      { id: 25732, label: 'Calma' },
      { id: 2414, label: 'Asustado' },
      { id: 2428, label: 'Cansado' },
      { id: 2416, label: 'Contento' },
    ],
  },
  {
    name: 'Alimentos',
    items: [
      { id: 2388, label: 'Manzana' },
      { id: 2422, label: 'Leche' },
      { id: 2429, label: 'Pan' },
      { id: 2424, label: 'Agua' },
      { id: 2431, label: 'Galletas' },
      { id: 2464, label: 'Plátano' },
      { id: 2426, label: 'Comer' },
      { id: 2425, label: 'Sopa' },
    ],
  },
  {
    name: 'Rutinas e Higiene',
    items: [
      { id: 2449, label: 'Lavar manos' },
      { id: 2438, label: 'Cepillar dientes' },
      { id: 2453, label: 'Despertar' },
      { id: 2406, label: 'Dormir' },
      { id: 2442, label: 'Vestirse' },
      { id: 2444, label: 'Guardar' },
      { id: 2446, label: 'Bañarse' },
      { id: 2445, label: 'Ayuda' },
    ],
  },
  {
    name: 'Escuela y Materiales',
    items: [
      { id: 2408, label: 'Lápiz' },
      { id: 2406, label: 'Libro' },
      { id: 2432, label: 'Tijeras' },
      { id: 2435, label: 'Mochila' },
      { id: 2433, label: 'Computadora' },
      { id: 2402, label: 'Jugar' },
      { id: 2436, label: 'Pizarra' },
      { id: 2420, label: 'Pintar' },
    ],
  },
  {
    name: 'Animales',
    items: [
      { id: 2486, label: 'Perro' },
      { id: 2488, label: 'Gato' },
      { id: 2490, label: 'Pájaro' },
      { id: 2492, label: 'Pez' },
      { id: 2495, label: 'León' },
      { id: 2498, label: 'Elefante' },
      { id: 2500, label: 'Caballo' },
      { id: 2502, label: 'Vaca' },
    ],
  },
];

export const PictogramPickerModal: React.FC<PictogramPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Seleccionar Pictograma o Imagen',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Emociones');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; label: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = encodeURIComponent(searchTerm.trim().toLowerCase());
        const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${query}`);
        if (res.ok) {
          const data: ArasaacSearchResult[] = await res.json();
          const mapped = data.slice(0, 24).map((item) => ({
            id: item._id,
            label: item.keywords?.[0]?.keyword || 'Pictograma',
          }));
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error buscando pictogramas:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelectPictogram = (id: number, label: string) => {
    const url = `https://api.arasaac.org/api/pictograms/${id}?download=false`;
    onSelect(url, label);
    onClose();
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelect(customUrl.trim(), 'Imagen');
      onClose();
    }
  };

  const currentCategoryItems =
    PRESET_CATEGORIES.find((c) => c.name === activeCategory)?.items || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera del modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                Biblioteca Oficial ARASAAC adaptada para TEA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador y URL personalizada */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en ARASAAC (ej. pelota, comer, contento, cepillo, perro)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categorías sugeridas si no hay búsqueda activa */}
          {!searchTerm && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    activeCategory === cat.name
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contenido / Rejilla de Pictogramas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[16rem]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-semibold">Buscando pictogramas en ARASAAC...</span>
            </div>
          ) : searchTerm ? (
            searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No se encontraron pictogramas para "{searchTerm}"</p>
                <p className="text-xs mt-1 text-slate-400">Intenta con un término sinónimo o escribe una URL abajo.</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Resultados de búsqueda ({searchResults.length})
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPictogram(item.id, item.label)}
                      className="group p-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-between text-center min-h-[6.5rem]"
                    >
                      <div className="w-14 h-14 relative flex items-center justify-center">
                        <img
                          src={`https://api.arasaac.org/api/pictograms/${item.id}?download=false`}
                          alt={item.label}
                          className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 capitalize line-clamp-1 w-full mt-1">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Colección: {activeCategory}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                {currentCategoryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPictogram(item.id, item.label)}
                    className="group p-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-between text-center min-h-[7rem]"
                  >
                    <div className="w-14 h-14 relative flex items-center justify-center">
                      <img
                        src={`https://api.arasaac.org/api/pictograms/${item.id}?download=false`}
                        alt={item.label}
                        className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 capitalize line-clamp-1 w-full mt-1">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal: Pegar URL manual alternativa */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-2">
          <form onSubmit={handleApplyCustomUrl} className="flex-1 flex items-center gap-2 w-full">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="O pega una URL de imagen directa (https://...)"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!customUrl.trim()}
              className="text-xs font-bold whitespace-nowrap"
            >
              Usar URL
            </Button>
          </form>

          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs font-bold">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
