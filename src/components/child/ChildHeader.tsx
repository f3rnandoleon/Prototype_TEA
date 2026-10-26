'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, ShieldAlert, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChildHeaderProps {
  childName: string;
  childId: string;
  currentSectionTitle?: string;
}

export const ChildHeader: React.FC<ChildHeaderProps> = ({
  childName,
  childId,
  currentSectionTitle,
}) => {
  const router = useRouter();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <>
      <header className="w-full bg-white/95 border-b-4 border-emerald-400 py-3 px-4 sm:px-6 flex items-center justify-between shadow-md select-none sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link
            href={`/child/${childId}`}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-2xl shadow-md hover:scale-105 active:scale-95 transition-all"
            aria-label="Ir a la pantalla principal infantil"
          >
            <Home className="w-8 h-8" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Hola, {childName}
              </span>
              <span className="text-2xl">⭐</span>
            </div>
            {currentSectionTitle && (
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {currentSectionTitle}
              </span>
            )}
          </div>
        </div>

        {/* Botón Salir Protegido */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          title="Salir del modo infantil (requiere confirmación adulta)"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Panel Adulto</span>
        </button>
      </header>

      {/* Modal de confirmación para salir al panel adulto */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Salir del Modo Niño?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Para regresar al panel administrativo de tutor o profesional, confirma a continuación.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowExitConfirm(false)}
                className="font-bold text-slate-700"
              >
                Quedarme aquí
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/tutor')}
                className="font-bold"
              >
                Sí, salir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
