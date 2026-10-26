'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Calendar, BookOpen, Heart, Volume2 } from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { IChild } from '@/types';

interface ChildDashboardProps {
  params: {
    childId: string;
  };
}

export default function ChildDashboardPage({ params }: ChildDashboardProps) {
  const { childId } = params;
  const [child, setChild] = useState<IChild | null>(null);
  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      });
  }, [childId]);

  const handlePlayVoice = (text: string) => {
    if (child?.accessibility?.soundEnabled !== false) {
      speak(text);
    }
  };

  const displayName = child?.nickname || child?.name || 'Amigo';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/50 to-indigo-50 flex flex-col">
      <ChildHeader childName={displayName} childId={childId} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            ¿Qué quieres hacer hoy?
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Toca cualquiera de las opciones para comenzar
          </p>
        </div>

        {/* Los 4 Accesos Principales del Niño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
          {/* 1. COMUNICAR */}
          <Link
            href={`/child/${childId}/aac`}
            onClick={() => handlePlayVoice('Comunicar')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-4xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl hover:shadow-2xl border-4 border-emerald-300 hover:border-white active:scale-95 transition-all text-center min-h-[12rem] sm:min-h-[14rem]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              1. Comunicar
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-100 mt-1">
              Tablero de pictogramas y voz
            </span>
          </Link>

          {/* 2. MI DÍA */}
          <Link
            href={`/child/${childId}/schedule`}
            onClick={() => handlePlayVoice('Mi día')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-4xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-xl hover:shadow-2xl border-4 border-sky-300 hover:border-white active:scale-95 transition-all text-center min-h-[12rem] sm:min-h-[14rem]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              2. Mi Día
            </span>
            <span className="text-xs sm:text-sm font-bold text-sky-100 mt-1">
              Agenda y pasos de mi rutina
            </span>
          </Link>

          {/* 3. ACTIVIDADES */}
          <Link
            href={`/child/${childId}/activities`}
            onClick={() => handlePlayVoice('Actividades')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-4xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl hover:shadow-2xl border-4 border-amber-300 hover:border-white active:scale-95 transition-all text-center min-h-[12rem] sm:min-h-[14rem]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              3. Actividades
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-100 mt-1">
              Juegos y aprendizaje adaptado
            </span>
          </Link>

          {/* 4. NECESITO UNA PAUSA (ZONA DE CALMA) */}
          <Link
            href={`/child/${childId}/calm`}
            onClick={() => handlePlayVoice('Necesito una pausa')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-4xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-xl hover:shadow-2xl border-4 border-indigo-300 hover:border-white active:scale-95 transition-all text-center min-h-[12rem] sm:min-h-[14rem]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              4. Necesito una pausa
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-100 mt-1">
              Zona de calma y relajación
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
