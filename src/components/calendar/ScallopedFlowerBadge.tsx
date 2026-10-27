'use client';

import React from 'react';

interface ScallopedFlowerBadgeProps {
  day: number | string;
  label?: string;
  color?: 'purple' | 'rose' | 'teal' | 'indigo' | 'amber';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Insignia Neuroafirmativa para el Calendario TEA.
 * Destaca sesiones de terapia, hitos de logro y anticipación estructurada.
 */
export const ScallopedFlowerBadge: React.FC<ScallopedFlowerBadgeProps> = ({
  day,
  label = 'TERAPIA',
  color = 'indigo',
  onClick,
  className = '',
  size = 'md',
}) => {
  // Paleta neuroafirmativa armónica con el resto de módulos
  const colorGradients = {
    indigo: {
      from: '#6366f1',
      to: '#4338ca',
      shadow: 'rgba(79, 70, 229, 0.35)',
    },
    teal: {
      from: '#10b981',
      to: '#059669',
      shadow: 'rgba(16, 185, 129, 0.35)',
    },
    amber: {
      from: '#f59e0b',
      to: '#d97706',
      shadow: 'rgba(245, 158, 11, 0.35)',
    },
    purple: {
      from: '#8b5cf6',
      to: '#6d28d9',
      shadow: 'rgba(139, 92, 246, 0.35)',
    },
    rose: {
      from: '#0ea5e9',
      to: '#0284c7', // Adaptado a azul cielo para anticipación y calma visual
      shadow: 'rgba(14, 165, 233, 0.35)',
    },
  };

  const currentTheme = colorGradients[color] || colorGradients.indigo;

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-14 sm:h-14',
    md: 'w-12 h-12 -my-1 sm:w-20 sm:h-20 sm:-my-3',
    lg: 'w-14 h-14 -my-1.5 sm:w-24 sm:h-24 sm:-my-4',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 z-20 ${sizeClasses[size]} ${className}`}
      style={{ filter: `drop-shadow(0 6px 14px ${currentTheme.shadow})` }}
      title={`${label} - Día ${day}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`tea-badge-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.from} />
            <stop offset="100%" stopColor={currentTheme.to} />
          </linearGradient>
          <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Ficha / Insignia redondeada neuroafirmativa con contorno suave y accesible */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="26"
          fill={`url(#tea-badge-grad-${color})`}
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Ícono de estrella o hito de anticipación sutil */}
        <circle cx="50" cy="24" r="3.5" fill="#ffffff" opacity="0.95" />

        {/* Etiqueta superior en mayúsculas claras */}
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="0.08em"
          style={{ textTransform: 'uppercase' }}
        >
          {label.length > 9 ? label.substring(0, 8) + '…' : label}
        </text>

        {/* Número de día en negrita y tipografía limpia */}
        <text
          x="50"
          y="73"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {day}
        </text>
      </svg>
    </div>
  );
};
