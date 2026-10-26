'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Volume2,
  Clock,
  Sparkles,
  Heart,
  ArrowRight,
  Info,
  Coffee,
  AlertTriangle,
  CalendarCheck2,
  Smile,
} from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { Button } from '@/components/ui/Button';
import { SensoryBatteryWidget } from '@/components/child/SensoryBatteryWidget';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { IChild, IRoutine, IRoutineProgress, IRoutineStep, IScheduleEvent, IPlanChange } from '@/types';

interface SchedulePageProps {
  params: {
    childId: string;
  };
}

export default function KidSchedulePage({ params }: SchedulePageProps) {
  const { childId } = params;
  const [child, setChild] = useState<IChild | null>(null);
  const [routines, setRoutines] = useState<IRoutine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<IRoutine | null>(null);
  const [progress, setProgress] = useState<IRoutineProgress | null>(null);
  const [events, setEvents] = useState<IScheduleEvent[]>([]);
  const [activePlanChange, setActivePlanChange] = useState<IPlanChange | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal para comunicar cambios imprevistos de forma estructurada
  const [showUnexpectedChange, setShowUnexpectedChange] = useState(false);
  const [selectedChildOption, setSelectedChildOption] = useState<string | null>(null);

  const { speak } = useSpeechSynthesis({
    rate: child?.accessibility?.voiceSpeed || 0.9,
    lang: 'es-ES',
  });

  useEffect(() => {
    // 1. Cargar perfil del niño
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      });

    // 2. Cargar rutinas
    fetch(`/api/routines?childId=${childId}`)
      .then((res) => res.json())
      .then((data) => {
        const rList: IRoutine[] = data.routines || [];
        setRoutines(rList);
        if (rList.length > 0) {
          setActiveRoutine(rList[0]);
          loadProgress(rList[0]._id);
        }
      })
      .finally(() => setIsLoading(false));

    // 3. Cargar eventos no rutinarios / anticipación
    fetch(`/api/schedule/events?childId=${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      })
      .catch((e) => console.error(e));

    // 4. Cargar cambio de plan activo
    fetch(`/api/schedule/plan-change?childId=${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.activeChange) {
          setActivePlanChange(data.activeChange);
        }
      })
      .catch((e) => console.error(e));
  }, [childId]);

  const loadProgress = async (routineId: string) => {
    try {
      const res = await fetch(`/api/routines/${routineId}/progress`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStep = async (step: IRoutineStep) => {
    if (!activeRoutine) return;
    const isCompleted = progress?.completedStepIds.includes(step.id) || false;
    const nextCompleted = !isCompleted;

    // Feedback por voz
    if (nextCompleted) {
      speak(`¡Muy bien! Has completado: ${step.title}`);
    } else {
      speak(step.title);
    }

    // Actualización optimista
    setProgress((prev) => {
      const currentIds = prev?.completedStepIds || [];
      const updatedIds = nextCompleted
        ? [...currentIds, step.id]
        : currentIds.filter((id) => id !== step.id);
      return {
        _id: prev?._id || 'temp',
        childId,
        routineId: activeRoutine._id,
        date: new Date().toISOString().split('T')[0],
        completedStepIds: updatedIds,
        status: updatedIds.length >= activeRoutine.steps.length ? 'completed' : 'in_progress',
      };
    });

    // Persistir en servidor
    try {
      await fetch(`/api/routines/${activeRoutine._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          isCompleted: nextCompleted,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeakStep = (title: string, desc?: string) => {
    speak(`${title}. ${desc || ''}`);
  };

  const handleOpenPlanChange = () => {
    setShowUnexpectedChange(true);
    const textToSpeak = activePlanChange
      ? `Aviso de cambio en el plan. No haremos ${activePlanChange.originalActivity}. En su lugar haremos ${activePlanChange.newTask}.`
      : 'A veces los planes cambian y todo está bien.';
    speak(textToSpeak);
  };

  const completedCount = progress?.completedStepIds.length || 0;
  const totalSteps = activeRoutine?.steps.length || 0;

  // Encontrar el paso actual pendiente y el siguiente
  const uncompletedSteps =
    activeRoutine?.steps.filter((s) => !progress?.completedStepIds.includes(s.id)) || [];

  const currentStep = uncompletedSteps[0] || null;
  const nextStep = uncompletedSteps[1] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50 flex flex-col select-none">
      <ChildHeader
        childName={child?.nickname || child?.name || 'Amigo'}
        childId={childId}
        currentSectionTitle="Mi Día (Agenda Visual)"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* AVISO ACTIVO DE CAMBIO DE PLANES (ANTICIPACIÓN COGNITIVA) */}
        {activePlanChange && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-3 border-amber-400 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">⭐</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Cambio de planes para hoy
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  Hoy no haremos: <span className="line-through text-slate-500">{activePlanChange.originalActivity}</span>
                </h2>
                <p className="text-sm font-bold text-emerald-800">
                  En su lugar haremos: {activePlanChange.newTask}
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenPlanChange}
              variant="primary"
              size="md"
              className="w-full sm:w-auto font-black rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-md gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver explicación visual</span>
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-bold">Cargando tu agenda...</div>
        ) : routines.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-4xl border-2 border-dashed border-slate-200">
            <span className="text-5xl mb-3 inline-block">☀️</span>
            <h2 className="text-2xl font-black text-slate-800">No hay rutinas para hoy</h2>
            <p className="text-slate-500 font-semibold mt-1">
              Pídele a tu tutor o docente que agregue actividades en la sección de Rutinas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selector de Rutinas si hay más de una */}
            {routines.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {routines.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => {
                      setActiveRoutine(r);
                      loadProgress(r._id);
                    }}
                    className={`px-4 py-2 rounded-2xl text-sm font-black whitespace-nowrap transition-all border-2 ${
                      activeRoutine?._id === r._id
                        ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}

            {/* SECCIÓN 1: ACTIVIDAD ACTUAL Y SIGUIENTE (ANTICIPACIÓN COGNITIVA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ahora mismo */}
              <div className="p-6 rounded-4xl bg-white border-4 border-emerald-500 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      ▶ Ahora mismo
                    </span>
                    {currentStep && (
                      <button
                        onClick={() => handleSpeakStep(currentStep.title, currentStep.description)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                        title="Escuchar en voz alta"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>

                  {currentStep ? (
                    <div className="flex items-center space-x-4">
                      {currentStep.iconUrl && (
                        <img
                          src={currentStep.iconUrl}
                          alt=""
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none drop-shadow-sm"
                        />
                      )}
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                          {currentStep.title}
                        </h3>
                        {currentStep.description && (
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            {currentStep.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-emerald-700 font-black text-lg">
                      🎉 ¡Has terminado todas las actividades de esta rutina!
                    </div>
                  )}
                </div>

                {currentStep && (
                  <Button
                    onClick={() => handleToggleStep(currentStep)}
                    variant="primary"
                    size="lg"
                    className="mt-6 w-full font-black text-lg py-4 rounded-2xl gap-2 shadow-lg shadow-emerald-600/30 active:scale-95"
                  >
                    <CheckCircle2 className="w-7 h-7" />
                    <span>Marcar como Listo</span>
                  </Button>
                )}
              </div>

              {/* Siguiente actividad */}
              <div className="p-6 rounded-4xl bg-white/90 border-4 border-slate-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      ⏭ Después de esto:
                    </span>
                    {nextStep && (
                      <button
                        onClick={() => handleSpeakStep(nextStep.title)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                        title="Escuchar en voz alta"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {nextStep ? (
                    <div className="flex items-center space-x-4">
                      {nextStep.iconUrl && (
                        <img
                          src={nextStep.iconUrl}
                          alt=""
                          className="w-14 h-14 sm:w-16 sm:h-16 object-contain pointer-events-none opacity-80"
                        />
                      )}
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-700 leading-tight">
                          {nextStep.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tiempo estimado: ~{nextStep.estimatedMinutes || 10} min
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 font-bold text-sm">
                      {currentStep ? 'No hay más actividades después de esta' : 'Tiempo libre o de descanso'}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Progreso:</span>
                  <span>
                    {completedCount} de {totalSteps} pasos completados
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: LISTA COMPLETA DE PASOS DE LA RUTINA */}
            <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>Todos los pasos de: {activeRoutine?.title}</span>
              </h3>

              <div className="space-y-3">
                {activeRoutine?.steps.map((step, idx) => {
                  const isDone = progress?.completedStepIds.includes(step.id) || false;
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleToggleStep(step)}
                      className={`p-4 rounded-3xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-400 w-6">#{idx + 1}</span>
                        {step.iconUrl && (
                          <img
                            src={step.iconUrl}
                            alt=""
                            className="w-10 h-10 object-contain pointer-events-none"
                          />
                        )}
                        <div>
                          <p
                            className={`font-black text-base ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-800'
                            }`}
                          >
                            {step.title}
                          </p>
                          {step.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeakStep(step.title, step.description);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        {isDone ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-7 h-7 text-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 3: EVENTOS NO RUTINARIOS Y ANTICIPACIÓN VISUAL (SI HAY) */}
            {events.length > 0 && (
              <div className="bg-white p-6 rounded-4xl border-2 border-indigo-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗓️</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      Eventos especiales y salidas programadas
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Anticipación visual de momentos diferentes para que estés preparado y tranquilo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {events.map((ev) => (
                    <div
                      key={ev._id}
                      className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3"
                    >
                      <span className="text-3xl p-2 bg-white rounded-2xl shadow-xs">
                        {ev.iconEmoji || '📅'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-black text-slate-900 text-sm">{ev.title}</h4>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            {ev.startTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{ev.description}</p>
                        {ev.visualPrepNotes && (
                          <div className="mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                            💡 Apoyo: {ev.visualPrepNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 4: TERMÓMETRO SENSORIAL Y DE BIENESTAR (AUTORREGISTRO / REGISTRO ASISTIDO) */}
            <SensoryBatteryWidget
              childId={childId}
              childName={child?.nickname || child?.name}
              voiceSpeed={child?.accessibility?.voiceSpeed}
            />

            {/* SECCIÓN 5: BOTONES DE APOYO RÁPIDO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href={`/child/${childId}/calm`}>
                <button className="w-full p-4 rounded-3xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-900 font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                  <Coffee className="w-6 h-6 text-indigo-600" />
                  <span>Necesito una pausa tranquila</span>
                </button>
              </Link>

              {/* Botón para abrir el diálogo explicativo de cambio de plan */}
              <button
                onClick={handleOpenPlanChange}
                className="w-full p-4 rounded-3xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Info className="w-5 h-5 text-amber-600" />
                <span>¿Hubo un cambio en el plan?</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: FLUJO AMABLE PARA CAMBIOS INESPERADOS */}
      {showUnexpectedChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-400 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">Un cambio en el plan</h2>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              A veces los planes cambian por diferentes razones, y todo está bien. Aquí está lo que haremos con calma:
            </p>

            <div className="space-y-3 text-left mb-6">
              {/* 1. Lo que no haremos ahora */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <span className="text-[11px] font-bold text-rose-600 uppercase">
                    1. Lo que no haremos ahora:
                  </span>
                  <p className="font-black text-sm text-slate-800">
                    {activePlanChange?.originalActivity || 'Ir a la actividad prevista'}
                  </p>
                </div>
              </div>

              {/* 2. Lo que haremos en su lugar */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">
                    2. Lo que haremos en su lugar:
                  </span>
                  <p className="font-black text-sm text-slate-900">
                    {activePlanChange?.newTask || 'Una actividad tranquila juntos'}
                  </p>
                </div>
              </div>

              {/* 3. Lo que pasará después */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">⏭️</span>
                <div>
                  <span className="text-[11px] font-bold text-sky-700 uppercase">
                    3. Lo que pasará después:
                  </span>
                  <p className="font-black text-sm text-slate-800">
                    {activePlanChange?.nextTask || 'Seguiremos con nuestra rutina habitual'}
                  </p>
                </div>
              </div>

              {/* 4. Opciones para el niño (si fueron configuradas) */}
              {activePlanChange?.childOptions && activePlanChange.childOptions.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block mb-2">
                    🎯 Puedes elegir qué prefieres hacer:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activePlanChange.childOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedChildOption(opt);
                          speak(`Has elegido: ${opt}`);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-black border transition-all text-left ${
                          selectedChildOption === opt
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                const phrase = `Comprendido. Ahora haremos: ${
                  activePlanChange?.newTask || 'la actividad indicada'
                }. Vamos con calma.`;
                speak(phrase);
                setShowUnexpectedChange(false);
              }}
              className="w-full font-black text-base py-4 rounded-2xl shadow-md"
            >
              Comprendido, vamos con calma
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
