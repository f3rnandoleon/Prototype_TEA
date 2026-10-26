'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  ArrowLeft,
  Heart,
  Star,
} from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { Button } from '@/components/ui/Button';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { IActivity, IChild } from '@/types';

interface ActivityPlayerProps {
  params: {
    childId: string;
    activityId: string;
  };
}

function ActivityPlayerContent({ params }: ActivityPlayerProps) {
  const { childId, activityId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('asgId') || undefined;

  const [child, setChild] = useState<IChild | null>(null);
  const [activity, setActivity] = useState<IActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de ejecución
  const [supportsUsed, setSupportsUsed] = useState<string[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Estados específicos para TIPO A (Asociación)
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Estados específicos para TIPO B (Selección)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Estados específicos para TIPO C (Secuencias)
  const [orderedSequenceIds, setOrderedSequenceIds] = useState<string[]>([]);

  const { speak } = useSpeechSynthesis({
    rate: child?.accessibility?.voiceSpeed || 0.9,
    lang: 'es-ES',
  });

  useEffect(() => {
    // 1. Cargar niño
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      });

    // 2. Cargar actividad
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.activities || []).find((a: IActivity) => a._id === activityId);
        if (found) {
          setActivity(found);
          initActivity(found);
        }
      })
      .finally(() => setIsLoading(false));
  }, [childId, activityId]);

  const initActivity = (act: IActivity) => {
    if (act.activityType === 'association') {
      const pairs = act.config.pairs || [];
      setTotalItems(pairs.length);
    } else if (act.activityType === 'selection') {
      const questions = act.config.questions || [];
      setTotalItems(questions.length);
    } else if (act.activityType === 'sequence') {
      const steps = act.config.sequence || [];
      setTotalItems(steps.length);
    }
  };

  const handleUseHint = () => {
    if (!supportsUsed.includes('pista visual')) {
      setSupportsUsed((prev) => [...prev, 'pista visual']);
    }
    speak('Aquí tienes una pista para ayudarte.');
  };

  // Lógica Tipo A: Asociación
  const handleSelectLeft = (pairId: string) => {
    if (matchedPairs.includes(pairId)) return;
    setSelectedLeft(pairId);
    const pair = activity?.config.pairs?.find((p) => p.id === pairId);
    if (pair) speak(pair.leftText);
  };

  const handleSelectRight = (pairId: string) => {
    if (matchedPairs.includes(pairId)) return;
    if (!selectedLeft) {
      speak('Primero toca un elemento de la izquierda.');
      return;
    }

    if (selectedLeft === pairId) {
      // Coincidencia acertada
      const newMatches = [...matchedPairs, pairId];
      setMatchedPairs(newMatches);
      setSelectedLeft(null);
      speak('¡Muy bien! Pareja correcta.');

      if (activity?.config.pairs && newMatches.length >= activity.config.pairs.length) {
        finishActivity(newMatches.length, activity.config.pairs.length);
      }
    } else {
      speak('Inténtalo de nuevo con calma.');
    }
  };

  // Lógica Tipo B: Selección
  const handleSelectOption = (isCorrect: boolean, text: string) => {
    speak(text);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      speak('¡Excelente elección!');
      const questions = activity?.config.questions || [];
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        finishActivity(score + 1, questions.length);
      }
    } else {
      speak('No te preocupes, puedes volver a intentarlo.');
    }
  };

  // Lógica Tipo C: Secuencias
  const handleStepInSequence = (stepId: string) => {
    if (orderedSequenceIds.includes(stepId)) return;

    const sequence = activity?.config.sequence || [];
    const expectedStep = sequence[orderedSequenceIds.length];

    if (expectedStep && expectedStep.id === stepId) {
      const nextOrdered = [...orderedSequenceIds, stepId];
      setOrderedSequenceIds(nextOrdered);
      speak(`Bien hecho: ${expectedStep.text}`);

      if (nextOrdered.length >= sequence.length) {
        finishActivity(nextOrdered.length, sequence.length);
      }
    } else {
      speak('Observa bien el orden. Puedes intentarlo de nuevo.');
    }
  };

  const finishActivity = async (finalScore: number, finalTotal: number) => {
    setIsCompleted(true);
    setScore(finalScore);
    setTotalItems(finalTotal);

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    speak('¡Fantástico trabajo! Has completado toda la actividad.');

    // Persistir resultado
    try {
      await fetch(`/api/activities/${activityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          assignmentId,
          score: finalScore,
          totalItems: finalTotal,
          supportsUsed,
          timeSpentSeconds,
        }),
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none">
      <ChildHeader
        childName={child?.nickname || child?.name || 'Amigo'}
        childId={childId}
        currentSectionTitle={activity?.title || 'Actividad'}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        {isLoading || !activity ? (
          <div className="py-20 text-center text-slate-400 font-bold">Cargando actividad...</div>
        ) : isCompleted ? (
          /* PANTALLA AMABLE DE FINALIZACIÓN */
          <div className="bg-white rounded-4xl p-8 sm:p-12 text-center shadow-xl border-4 border-emerald-400 max-w-lg mx-auto my-auto animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Star className="w-14 h-14 fill-emerald-500 text-emerald-500 animate-bounce" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2">¡Completaste la actividad!</h2>
            <p className="text-sm text-slate-600 font-medium mb-6">
              Participaste con calma y dedicación. ¡Lo hiciste genial!
            </p>

            {supportsUsed.length > 0 && (
              <div className="mb-6 p-3 bg-sky-50 rounded-2xl text-xs text-sky-800 border border-sky-200">
                Apoyos utilizados: <span className="font-bold">{supportsUsed.join(', ')}</span>
              </div>
            )}

            <div className="space-y-3">
              <Link href={`/child/${childId}/activities`}>
                <Button variant="primary" size="lg" className="w-full font-black text-base py-4 rounded-2xl">
                  <span>Ver más actividades</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href={`/child/${childId}`}>
                <Button variant="outline" size="md" className="w-full font-bold">
                  Ir al menú principal
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instrucciones amables con botón de lectura por voz */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {activity.skillType}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {activity.instructions || activity.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speak(activity.instructions || activity.description)}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Escuchar instrucciones"
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                <button
                  onClick={handleUseHint}
                  className="p-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Pedir una pista visual"
                >
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span className="hidden sm:inline">Pista</span>
                </button>
              </div>
            </div>

            {/* MOTOR TIPO A: ASOCIACIÓN VISUAL */}
            {activity.activityType === 'association' && (
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Paso 1: Toca uno aquí
                  </span>
                  {activity.config.pairs?.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);
                    const isSelected = selectedLeft === pair.id;
                    return (
                      <button
                        key={pair.id}
                        disabled={isMatched}
                        onClick={() => handleSelectLeft(pair.id)}
                        className={`w-full p-4 rounded-3xl border-4 flex items-center space-x-3 transition-all text-left shadow-sm ${
                          isMatched
                            ? 'bg-emerald-50 border-emerald-400 opacity-60'
                            : isSelected
                            ? 'bg-emerald-100 border-emerald-600 ring-4 ring-emerald-300 scale-102'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {pair.leftImage && (
                          <img
                            src={pair.leftImage}
                            alt=""
                            className="w-12 h-12 object-contain pointer-events-none"
                          />
                        )}
                        <span className="font-black text-sm sm:text-base text-slate-800">
                          {pair.leftText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Columna Derecha */}
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Paso 2: Toca su pareja
                  </span>
                  {activity.config.pairs?.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);
                    return (
                      <button
                        key={pair.id}
                        disabled={isMatched}
                        onClick={() => handleSelectRight(pair.id)}
                        className={`w-full p-4 rounded-3xl border-4 flex items-center space-x-3 transition-all text-left shadow-sm ${
                          isMatched
                            ? 'bg-emerald-50 border-emerald-400 opacity-60'
                            : 'bg-white border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {pair.rightImage && (
                          <img
                            src={pair.rightImage}
                            alt=""
                            className="w-12 h-12 object-contain pointer-events-none"
                          />
                        )}
                        <span className="font-black text-sm sm:text-base text-slate-800">
                          {pair.rightText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MOTOR TIPO B: SELECCIÓN ENTRE OPCIONES */}
            {activity.activityType === 'selection' && (
              <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-md">
                {(() => {
                  const questions = activity.config.questions || [];
                  const q = questions[currentQuestionIndex];
                  if (!q) return null;

                  return (
                    <div>
                      <div className="text-center mb-6">
                        {q.promptImage && (
                          <img
                            src={q.promptImage}
                            alt=""
                            className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto mb-3 pointer-events-none"
                          />
                        )}
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">{q.promptText}</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(opt.isCorrect, opt.text)}
                            className="p-5 rounded-3xl border-4 border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/50 flex items-center space-x-4 shadow-sm active:scale-95 transition-all text-left"
                          >
                            {opt.imageUrl && (
                              <img
                                src={opt.imageUrl}
                                alt=""
                                className="w-14 h-14 object-contain pointer-events-none"
                              />
                            )}
                            <span className="font-black text-lg text-slate-800">{opt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* MOTOR TIPO C: SECUENCIAS TEMPORALES */}
            {activity.activityType === 'sequence' && (
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Toca las tarjetas en el orden correcto (1, 2, 3...):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activity.config.sequence?.map((step) => {
                    const isPlaced = orderedSequenceIds.includes(step.id);
                    const position = orderedSequenceIds.indexOf(step.id) + 1;

                    return (
                      <button
                        key={step.id}
                        disabled={isPlaced}
                        onClick={() => handleStepInSequence(step.id)}
                        className={`p-6 rounded-4xl border-4 flex flex-col items-center justify-between text-center transition-all min-h-[12rem] shadow-sm ${
                          isPlaced
                            ? 'bg-emerald-50 border-emerald-500 opacity-60'
                            : 'bg-white border-slate-200 hover:border-amber-400 active:scale-95'
                        }`}
                      >
                        {isPlaced && (
                          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm mb-2 shadow-sm">
                            {position}
                          </span>
                        )}

                        {step.imageUrl && (
                          <img
                            src={step.imageUrl}
                            alt=""
                            className="w-20 h-20 object-contain pointer-events-none mb-2"
                          />
                        )}

                        <span className="font-black text-sm sm:text-base text-slate-800">
                          {step.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ActivityPlayerPage(props: ActivityPlayerProps) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando actividad...</div>}>
      <ActivityPlayerContent {...props} />
    </Suspense>
  );
}

