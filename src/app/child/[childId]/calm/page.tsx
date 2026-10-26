'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  VolumeX,
  CloudRain,
  Waves,
  Wind,
  MessageSquare,
  Home,
  Sparkles,
  HelpCircle,
  Coffee,
} from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { Button } from '@/components/ui/Button';
import { calmAudio } from '@/features/calm/calmAudio';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { IChild } from '@/types';

interface CalmPageProps {
  params: {
    childId: string;
  };
}

export default function CalmZonePage({ params }: CalmPageProps) {
  const { childId } = params;
  const [child, setChild] = useState<IChild | null>(null);
  const [palette, setPalette] = useState<'lavender' | 'sage' | 'sky' | 'sand'>('lavender');
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      });

    // Ritmo visual suave y opcional de respiración autorregulada (4s - 4s - 4s)
    const interval = setInterval(() => {
      setBreathePhase((prev) => (prev === 'inhale' ? 'hold' : prev === 'hold' ? 'exhale' : 'inhale'));
    }, 4000);

    return () => {
      clearInterval(interval);
      calmAudio.stop();
    };
  }, [childId]);

  const handlePlaySound = (soundType: 'rain' | 'ocean' | 'whitenoise') => {
    if (activeSound === soundType) {
      calmAudio.stop();
      setActiveSound(null);
    } else {
      calmAudio.play(soundType, 0.2);
      setActiveSound(soundType);
    }
  };

  const handleStopAllSound = () => {
    calmAudio.stop();
    setActiveSound(null);
  };

  const handleExpress = (text: string) => {
    speak(text);
  };

  // Paletas de color de baja estimulación
  const themeStyles = {
    lavender: 'bg-indigo-50/60 text-indigo-950 border-indigo-200',
    sage: 'bg-emerald-50/60 text-emerald-950 border-emerald-200',
    sky: 'bg-sky-50/60 text-sky-950 border-sky-200',
    sand: 'bg-amber-50/60 text-amber-950 border-amber-200',
  };

  const circleColors = {
    lavender: 'from-indigo-200 to-purple-200 border-indigo-300',
    sage: 'from-emerald-200 to-teal-200 border-emerald-300',
    sky: 'from-sky-200 to-blue-200 border-sky-300',
    sand: 'from-amber-200 to-orange-200 border-amber-300',
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${themeStyles[palette]}`}>
      <ChildHeader
        childName={child?.nickname || child?.name || 'Amigo'}
        childId={childId}
        currentSectionTitle="Zona de Calma"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        {/* Cabecera tranquila */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <Heart className="w-7 h-7 text-rose-400 fill-rose-200" />
              <span>Estás seguro. Tómate el tiempo que necesites.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Elige los colores o sonidos que te hagan sentir mejor. No tienes que hacer nada que no quieras.
            </p>
          </div>

          {/* Selector de paleta de baja estimulación */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setPalette('lavender')}
              title="Paleta Lavanda"
              className={`w-7 h-7 rounded-xl bg-indigo-200 border-2 transition-transform ${
                palette === 'lavender' ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent'
              }`}
            />
            <button
              onClick={() => setPalette('sage')}
              title="Paleta Salvia"
              className={`w-7 h-7 rounded-xl bg-emerald-200 border-2 transition-transform ${
                palette === 'sage' ? 'border-emerald-600 scale-110 shadow-sm' : 'border-transparent'
              }`}
            />
            <button
              onClick={() => setPalette('sky')}
              title="Paleta Cielo"
              className={`w-7 h-7 rounded-xl bg-sky-200 border-2 transition-transform ${
                palette === 'sky' ? 'border-sky-600 scale-110 shadow-sm' : 'border-transparent'
              }`}
            />
            <button
              onClick={() => setPalette('sand')}
              title="Paleta Arena"
              className={`w-7 h-7 rounded-xl bg-amber-200 border-2 transition-transform ${
                palette === 'sand' ? 'border-amber-600 scale-110 shadow-sm' : 'border-transparent'
              }`}
            />
          </div>
        </div>

        {/* Zona central: Visual relajante autorregulado */}
        <div className="my-8 flex flex-col items-center justify-center text-center">
          <div
            className={`w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-gradient-to-tr ${circleColors[palette]} border-4 shadow-xl flex items-center justify-center transition-all duration-[3000ms] ${
              breathePhase === 'inhale' ? 'scale-110' : breathePhase === 'hold' ? 'scale-105' : 'scale-90'
            }`}
          >
            <div className="text-center p-4">
              <span className="text-4xl sm:text-5xl">🌿</span>
              <p className="font-extrabold text-sm sm:text-base text-slate-700 mt-2">
                {breathePhase === 'inhale'
                  ? 'Inspira suave'
                  : breathePhase === 'hold'
                  ? 'Sostén con calma'
                  : 'Suelta el aire'}
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Sonidos Suaves y Silencio Inmediato */}
        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Sonidos relajantes (opcionales)
            </span>

            {/* BOTÓN SILENCIAR DE INMEDIATO */}
            <button
              onClick={handleStopAllSound}
              disabled={!activeSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 disabled:opacity-40 transition-all"
            >
              <VolumeX className="w-4 h-4" />
              <span>Silenciar de inmediato</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handlePlaySound('rain')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs sm:text-sm font-extrabold ${
                activeSound === 'rain'
                  ? 'border-sky-500 bg-sky-100 text-sky-900 shadow-inner'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CloudRain className="w-6 h-6 text-sky-500" />
              <span>Lluvia suave</span>
            </button>

            <button
              onClick={() => handlePlaySound('ocean')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs sm:text-sm font-extrabold ${
                activeSound === 'ocean'
                  ? 'border-teal-500 bg-teal-100 text-teal-900 shadow-inner'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Waves className="w-6 h-6 text-teal-500" />
              <span>Olas del mar</span>
            </button>

            <button
              onClick={() => handlePlaySound('whitenoise')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-xs sm:text-sm font-extrabold ${
                activeSound === 'whitenoise'
                  ? 'border-indigo-500 bg-indigo-100 text-indigo-900 shadow-inner'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Wind className="w-6 h-6 text-indigo-500" />
              <span>Ruido blanco</span>
            </button>
          </div>
        </div>

        {/* Botones de Expresión Rápida de Necesidad y Salida */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleExpress('Necesito ayuda por favor')}
            className="p-4 rounded-2xl bg-white border-2 border-amber-300 hover:border-amber-500 text-amber-900 font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Pedir Ayuda</span>
          </button>

          <Link href={`/child/${childId}/aac`} className="w-full">
            <button className="w-full p-4 rounded-2xl bg-white border-2 border-emerald-300 hover:border-emerald-500 text-emerald-900 font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Volver al Comunicador</span>
            </button>
          </Link>

          <Link href={`/child/${childId}`} className="w-full">
            <button className="w-full p-4 rounded-2xl bg-white border-2 border-indigo-300 hover:border-indigo-500 text-indigo-900 font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <Home className="w-5 h-5 text-indigo-600" />
              <span>Salir al Menú Principal</span>
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
