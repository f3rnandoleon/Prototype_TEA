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

export const ScallopedFlowerBadge: React.FC<ScallopedFlowerBadgeProps> = ({
  day,
  label = 'TERAPIA',
  color = 'purple',
  onClick,
  className = '',
  size = 'md',
}) => {
  // Configuración de gradientes según el color
  const colorGradients = {
    purple: {
      from: '#9d8df1',
      to: '#7c67db',
      shadow: 'rgba(124, 103, 219, 0.4)',
    },
    rose: {
      from: '#f472b6',
      to: '#e11d48',
      shadow: 'rgba(225, 29, 72, 0.35)',
    },
    teal: {
      from: '#2dd4bf',
      to: '#0d9488',
      shadow: 'rgba(13, 148, 136, 0.35)',
    },
    indigo: {
      from: '#818cf8',
      to: '#4f46e5',
      shadow: 'rgba(79, 70, 229, 0.35)',
    },
    amber: {
      from: '#fbbf24',
      to: '#d97706',
      shadow: 'rgba(217, 119, 6, 0.35)',
    },
  };

  const currentTheme = colorGradients[color] || colorGradients.purple;

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-14 sm:h-14',
    md: 'w-12 h-12 -my-1 sm:w-20 sm:h-20 sm:-my-3',
    lg: 'w-14 h-14 -my-1.5 sm:w-24 sm:h-24 sm:-my-4',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 z-20 ${sizeClasses[size]} ${className}`}
      style={{ filter: `drop-shadow(0 6px 12px ${currentTheme.shadow})` }}
      title={`${label} - Día ${day}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`flower-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.from} />
            <stop offset="100%" stopColor={currentTheme.to} />
          </linearGradient>
          {/* Sombra blanca externa como en el diseño de referencia */}
          <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Flor con 6 pétalos suaves y redondeados */}
        <path
          d="
            M 50,12
            C 58,12 65,18 69,25
            C 77,23 85,29 86,37
            C 92,42 94,52 90,60
            C 91,69 84,77 76,79
            C 72,86 63,90 55,89
            C 47,91 38,87 33,81
            C 25,81 18,74 17,66
            C 11,60 11,50 16,42
            C 14,34 20,26 29,24
            C 33,17 41,12 50,12 Z
          "
          fill={`url(#flower-grad-${color})`}
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Etiqueta superior en mayúsculas pequeñas */}
        <text
          x="50"
          y="42"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="0.08em"
          style={{ textTransform: 'uppercase' }}
        >
          {label.length > 9 ? label.substring(0, 8) + '…' : label}
        </text>

        {/* Número de día grande y en negrita */}
        <text
          x="50"
          y="69"
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
