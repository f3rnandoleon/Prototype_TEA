'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Heart, Coffee, ShieldAlert, Check, Volume2 } from 'lucide-react';
import { SensoryBatteryLevel } from '@/types';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';

interface SensoryBatteryWidgetProps {
  childId: string;
  childName?: string;
  onRegistered?: (level: SensoryBatteryLevel) => void;
  voiceSpeed?: number;
}

interface BatteryOption {
  level: SensoryBatteryLevel;
  emoji: string;
  title: string;
  subtitle: string;
  ttsPhrase: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  activeRing: string;
}

const BATTERY_OPTIONS: BatteryOption[] = [
  {
    level: 'comodo',
    emoji: '😊',
    title: 'Cómodo y tranquilo',
    subtitle: 'Me siento bien y con energía para seguir',
    ttsPhrase: 'Me siento cómodo y tranquilo. Estoy bien.',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-900',
    activeRing: 'ring-4 ring-emerald-500 bg-emerald-100',
  },
  {
    level: 'cansado',
    emoji: '🥱',
    title: 'Un poco cansado',
    subtitle: 'Tengo poca energía, prefiero ir más despacio',
    ttsPhrase: 'Estoy un poco cansado. Prefiero ir con calma.',
    bgClass: 'bg-amber-50 hover:bg-amber-100/80',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
    activeRing: 'ring-4 ring-amber-500 bg-amber-100',
  },
  {
    level: 'pausa',
    emoji: '☕',
    title: 'Necesito una pausa',
    subtitle: 'Quiero parar un ratito y descansar',
    ttsPhrase: 'Necesito una pausa para descansar.',
    bgClass: 'bg-sky-50 hover:bg-sky-100/80',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-900',
    activeRing: 'ring-4 ring-sky-500 bg-sky-100',
  },
  {
    level: 'sobrecarga',
    emoji: '⚡',
    title: 'Muchos estímulos',
    subtitle: 'Hay mucho ruido, luz o gente a mi alrededor',
    ttsPhrase: 'Hay demasiados estímulos. Necesito un lugar tranquilo.',
    bgClass: 'bg-rose-50 hover:bg-rose-100/80',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-900',
    activeRing: 'ring-4 ring-rose-500 bg-rose-100',
  },
];

export function SensoryBatteryWidget({
  childId,
  childName = 'Amigo',
  onRegistered,
  voiceSpeed = 0.9,
}: SensoryBatteryWidgetProps) {
  const [selectedLevel, setSelectedLevel] = useState<SensoryBatteryLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const { speak } = useSpeechSynthesis({ rate: voiceSpeed, lang: 'es-ES' });

  const handleSelect = async (option: BatteryOption) => {
    setSelectedLevel(option.level);
    speak(option.ttsPhrase);
    setIsSubmitting(true);

    try {
      await fetch('/api/tracking/battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          level: option.level,
          registeredBy: 'child',
          note: option.subtitle,
        }),
      });

      setFeedbackMessage(`¡Gracias por contarnos cómo te sientes!`);
      if (onRegistered) onRegistered(option.level);
    } catch (e) {
      console.error('Error al guardar batería sensorial', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-4xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              ¿Cómo te sientes en este momento?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Tu bienestar es lo más importante. Toca una opción para contarnos cómo está tu energía.
          </p>
        </div>

        {selectedLevel && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 self-start sm:self-auto border border-slate-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Registrado</span>
          </span>
        )}
      </div>

      {/* Grid de 4 estados subjetivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {BATTERY_OPTIONS.map((opt) => {
          const isSelected = selectedLevel === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelect(opt)}
              className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                opt.bgClass
              } ${opt.borderClass} ${isSelected ? opt.activeRing : 'hover:scale-[1.02] shadow-sm'} active:scale-95`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl sm:text-4xl pointer-events-none">{opt.emoji}</span>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(opt.title + '. ' + opt.subtitle);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        speak(opt.title + '. ' + opt.subtitle);
                      }
                    }}
                    className="p-1.5 rounded-xl hover:bg-black/5 text-slate-500 cursor-pointer"
                    title="Escuchar"
                  >
                    <Volume2 className="w-4 h-4" />
                  </div>
                </div>
                <h4 className={`text-base font-black ${opt.textClass} leading-tight`}>
                  {opt.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  {opt.subtitle}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Seleccionado</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sugerencia no impositiva si necesita descanso o hay sobrecarga */}
      {(selectedLevel === 'pausa' || selectedLevel === 'sobrecarga') && (
        <div className="mt-5 p-4 rounded-3xl bg-indigo-50/90 border-2 border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧸</span>
            <div>
              <p className="text-sm font-black text-indigo-950">
                ¿Te gustaría tomar una pausa tranquila?
              </p>
              <p className="text-xs text-indigo-800/80 font-medium">
                En la Zona de Calma puedes respirar, escuchar lluvia suave o descansar sin ruidos.
              </p>
            </div>
          </div>
          <Link href={`/child/${childId}/calm`} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 whitespace-nowrap">
              Ir a la Zona de Calma
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
