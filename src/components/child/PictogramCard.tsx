'use client';

import React from 'react';
import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IAACItem } from '@/types';

interface PictogramCardProps {
  item: IAACItem;
  onClick: (item: IAACItem) => void;
  size?: 'normal' | 'large' | 'extra-large';
  showVoiceIcon?: boolean;
  className?: string;
}

export const PictogramCard: React.FC<PictogramCardProps> = ({
  item,
  onClick,
  size = 'large',
  showVoiceIcon = false,
  className,
}) => {
  const sizeClasses = {
    normal: 'h-28 text-sm p-2',
    large: 'h-36 sm:h-44 text-base sm:text-lg p-3',
    'extra-large': 'h-44 sm:h-52 text-lg sm:text-xl p-4',
  };

  const imageSizes = {
    normal: 'w-16 h-16',
    large: 'w-20 h-20 sm:w-24 sm:h-24',
    'extra-large': 'w-24 h-24 sm:w-32 sm:h-32',
  };

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        'group relative flex flex-col items-center justify-between rounded-3xl bg-white border-4 border-slate-200 hover:border-emerald-500 hover:shadow-xl active:scale-95 transition-all text-slate-800 shadow-md select-none touch-manipulation focus:outline-none focus:ring-4 focus:ring-emerald-400',
        sizeClasses[size],
        className
      )}
      aria-label={`Pictograma: ${item.label}`}
    >
      {/* Indicador sutil de voz si aplica */}
      {showVoiceIcon && (
        <span className="absolute top-2 right-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Volume2 className="w-4 h-4" />
        </span>
      )}

      {/* Imagen del Pictograma */}
      <div className={cn('relative flex items-center justify-center mt-1', imageSizes[size])}>
        <img
          src={item.imageUrl}
          alt={item.label}
          loading="lazy"
          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-sm"
          onError={(e) => {
            // Si la imagen falla (offline o error de red), mostrar fallback visual
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Etiqueta textual en español */}
      <span className="w-full text-center font-black tracking-tight leading-tight line-clamp-2 px-1 mb-1 text-slate-900 group-hover:text-emerald-800">
        {item.label}
      </span>
    </button>
  );
};
