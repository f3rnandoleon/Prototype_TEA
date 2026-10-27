'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Heart,
  MessageSquare,
  Calendar,
  BookOpen,
  Home,
  Volume2,
  Lock,
  Unlock,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Send,
  AlertCircle,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IChild, IUser } from '@/types';

interface ChildRemoteControlWidgetProps {
  user?: IUser;
}

export const ChildRemoteControlWidget: React.FC<ChildRemoteControlWidgetProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [childrenList, setChildrenList] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('Buscando señal...');
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Actividades disponibles para lanzar
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  // Mensaje de voz personalizado
  const [customVoiceMessage, setCustomVoiceMessage] = useState<string>('');
  const [isSendingCommand, setIsSendingCommand] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // 1. Cargar niños vinculados
  useEffect(() => {
    fetch('/api/children')
      .then((res) => (res.ok ? res.json() : { children: [] }))
      .then((data) => {
        const list = data.children || [];
        setChildrenList(list);
        if (list.length > 0) {
          const storedId =
            typeof window !== 'undefined'
              ? localStorage.getItem('tea_selected_child_id')
              : null;
          const found = list.some((c: IChild) => c._id === storedId);
          setSelectedChildId(found ? (storedId as string) : list[0]._id);
        }
      })
      .catch(console.error);

    // Cargar actividades para el lanzador
    fetch('/api/activities')
      .then((res) => (res.ok ? res.json() : { activities: [] }))
      .then((data) => {
        setActivities(data.activities || []);
      })
      .catch(() => {});
  }, []);

  // 2. Monitorear periódicamente el estado de la tablet del niño seleccionado
  useEffect(() => {
    if (!selectedChildId) return;

    let isMounted = true;
    const fetchSessionStatus = async () => {
      try {
        const res = await fetch(`/api/children/${selectedChildId}/remote-control`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        setIsOnline(Boolean(data.isOnline));
        if (data.sessionControl) {
          setCurrentSection(data.sessionControl.currentSection || 'Menú Principal');
          setCurrentRoute(data.sessionControl.currentRoute || '');
          setIsLocked(Boolean(data.sessionControl.locked));
        }
      } catch (e) {
        // Ignorar errores temporales
      }
    };

    fetchSessionStatus();
    const interval = setInterval(fetchSessionStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedChildId]);

  // Enviar comando remoto
  const sendRemoteCommand = async (payload: {
    action: 'navigate' | 'speak' | 'lock' | 'unlock';
    targetRoute?: string;
    message?: string;
    speakVoice?: boolean;
    locked?: boolean;
    feedbackLabel: string;
  }) => {
    if (!selectedChildId) return;

    setIsSendingCommand(true);
    setSuccessFeedback(null);
    try {
      const res = await fetch(`/api/children/${selectedChildId}/remote-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: payload.action,
          targetRoute: payload.targetRoute,
          message: payload.message,
          speakVoice: payload.speakVoice !== false,
          locked: payload.locked,
        }),
      });

      if (res.ok) {
        setSuccessFeedback(payload.feedbackLabel);
        setTimeout(() => setSuccessFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Error al enviar comando remoto:', e);
    } finally {
      setIsSendingCommand(false);
    }
  };

  const selectedChild = childrenList.find((c) => c._id === selectedChildId);
  const childDisplayName = selectedChild?.nickname || selectedChild?.name || 'el niño';

  // Frases rápidas para emitir en el dispositivo del niño
  const quickPhrases = [
    'Vamos a tomar una pausa y respirar con calma 🧘',
    '¿Quieres comunicarte? Aquí tienes tu tablero 🗣️',
    'Vamos a revisar los pasos de tu día 📅',
    '¡Excelente trabajo, lo estás haciendo genial! ⭐',
    'Hora de ordenar con calma 🧸',
  ];

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      <aside
        aria-label="Control asistido del modo infantil"
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-slate-900 text-white font-black text-xs sm:text-sm shadow-2xl hover:shadow-indigo-500/30 hover:bg-indigo-950 active:scale-95 transition-all border-2 border-indigo-400/40 select-none cursor-pointer"
          title="Abrir panel de control remoto del Modo Niño"
          id="btn-open-remote-control"
        >
          {/* Indicador de conexión en vivo */}
          <span className="relative flex h-3 w-3">
            {isOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
            )}
          </span>

          <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="tracking-tight">Control Modo Niño</span>
          <span className="hidden lg:inline-block text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
            {isOnline ? 'En Vivo' : 'En Espera'}
          </span>
        </button>
      </aside>

      {/* Panel / Slide-Over Modal de Control Remoto */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remote-control-title"
          >
            {/* Cabecera del Panel */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2
                    id="remote-control-title"
                    className="font-black text-base sm:text-lg tracking-tight leading-tight"
                  >
                    Control Remoto Asistido
                  </h2>
                  <p className="text-[11px] text-indigo-200 font-medium">
                    Guía el dispositivo del niño a distancia
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar panel de control remoto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Principal del Panel */}
            <div className="p-4 sm:p-5 space-y-5 flex-1">
              {/* 1. Selector de Niño */}
              {childrenList.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Estudiante / Niño a Guiar
                  </label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => {
                      setSelectedChildId(e.target.value);
                      try {
                        localStorage.setItem('tea_selected_child_id', e.target.value);
                      } catch {}
                    }}
                    className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {childrenList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.nickname ? `(${c.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. Tarjeta de Estado del Dispositivo en Vivo */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Monitor del Dispositivo
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                    <span
                      className={`text-xs font-black ${
                        isOnline ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {isOnline ? 'Tablet Conectada' : 'En Espera / Sin Conexión'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between bg-white p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Pantalla Actual del Niño
                    </span>
                    <p className="font-black text-slate-800 text-xs sm:text-sm mt-0.5">
                      {currentSection}
                    </p>
                  </div>
                  {selectedChildId && (
                    <Link
                      href={`/child/${selectedChildId}`}
                      target="_blank"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-xl"
                      title="Abrir vista de niño en una pestaña nueva"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Feedback de orden exitosa */}
              {successFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successFeedback}</span>
                </div>
              )}

              {/* 3. Acciones de Navegación Forzada de 1 Toque */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Cambio Inmediato de Pantalla</span>
                  <span className="text-[10px] font-normal text-slate-400">1 Toque</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* ACCIÓN 1: Rincón de Calma (Relajación) */}
                  <button
                    disabled={isSendingCommand || !selectedChildId}
                    onClick={() =>
                      sendRemoteCommand({
                        action: 'navigate',
                        targetRoute: `/child/${selectedChildId}/calm`,
                        message: 'Vamos a tomar una pausa para respirar y relajarnos con calma 🧘',
                        feedbackLabel: `✓ Dispositivo de ${childDisplayName} enviado al Rincón de Calma`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-left active:scale-98 transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
                        🧘
                      </span>
                      <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Regulación
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                        Rincón de Calma
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Si está ansioso o sobrecargado
                      </p>
                    </div>
                  </button>

                  {/* ACCIÓN 2: Comunicador CAA */}
                  <button
                    disabled={isSendingCommand || !selectedChildId}
                    onClick={() =>
                      sendRemoteCommand({
                        action: 'navigate',
                        targetRoute: `/child/${selectedChildId}/aac`,
                        message: 'Aquí está tu tablero de comunicación para decir lo que necesitas 🗣️',
                        feedbackLabel: `✓ Dispositivo de ${childDisplayName} enviado al Comunicador CAA`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-left active:scale-98 transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                        🗣️
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Habla / Voz
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                        Comunicador (CAA)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Tablero de pictogramas
                      </p>
                    </div>
                  </button>

                  {/* ACCIÓN 3: Agenda / Mi Día */}
                  <button
                    disabled={isSendingCommand || !selectedChildId}
                    onClick={() =>
                      sendRemoteCommand({
                        action: 'navigate',
                        targetRoute: `/child/${selectedChildId}/schedule`,
                        message: 'Vamos a revisar la agenda y los pasos que siguen hoy 📅',
                        feedbackLabel: `✓ Dispositivo de ${childDisplayName} enviado a Mi Día`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-sky-200 text-left active:scale-98 transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center text-lg shadow-sm">
                        📅
                      </span>
                      <span className="text-[10px] font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                        Anticipación
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                        Mi Día / Rutina
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Pasos y actividades
                      </p>
                    </div>
                  </button>

                  {/* ACCIÓN 4: Menú Principal */}
                  <button
                    disabled={isSendingCommand || !selectedChildId}
                    onClick={() =>
                      sendRemoteCommand({
                        action: 'navigate',
                        targetRoute: `/child/${selectedChildId}`,
                        message: 'Volvamos a la pantalla principal 🏠',
                        feedbackLabel: `✓ Dispositivo de ${childDisplayName} enviado al Menú Principal`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left active:scale-98 transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center text-lg shadow-sm">
                        🏠
                      </span>
                      <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        Inicio
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm">
                        Menú Infantil
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        4 opciones básicas
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. Lanzador de Actividad Específica */}
              <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Lanzar Actividad Específica</span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="flex-1 text-xs font-bold p-2.5 rounded-xl border border-amber-200 bg-white text-slate-800"
                  >
                    <option value="">(Seleccionar actividad o juego)</option>
                    {activities.map((act) => (
                      <option key={act._id} value={act._id}>
                        {act.title} ({act.domain || 'Educativa'})
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={!selectedActivityId || isSendingCommand}
                    onClick={() => {
                      const act = activities.find((a) => a._id === selectedActivityId);
                      sendRemoteCommand({
                        action: 'navigate',
                        targetRoute: `/child/${selectedChildId}/activities/${selectedActivityId}`,
                        message: `¡Hora de jugar y aprender! Vamos a: ${act?.title || 'tu actividad'} 🎯`,
                        feedbackLabel: `✓ Actividad "${act?.title}" lanzada en el dispositivo`,
                      });
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 rounded-xl"
                  >
                    Lanzar
                  </Button>
                </div>
              </div>

              {/* 5. Mensaje de Voz Directo a la Tablet */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mensaje de Voz Directo</span>
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {quickPhrases.map((phrase, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomVoiceMessage(phrase)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 rounded-lg px-2.5 py-1 text-left transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVoiceMessage}
                    onChange={(e) => setCustomVoiceMessage(e.target.value)}
                    placeholder="Escribe lo que la tablet pronunciará..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={!customVoiceMessage.trim() || isSendingCommand}
                    onClick={() => {
                      sendRemoteCommand({
                        action: 'speak',
                        message: customVoiceMessage,
                        feedbackLabel: '✓ Mensaje de voz reproducido en la tablet',
                      });
                      setCustomVoiceMessage('');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs shrink-0 rounded-xl gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Hablar</span>
                  </Button>
                </div>
              </div>

              {/* 6. Modo Enfoque / Candado de Navegación */}
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isLocked
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 text-xs block">
                      Modo Enfoque / Bloqueo
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isLocked
                        ? 'El niño permanece en la pantalla asignada'
                        : 'Navegación libre permitida para el niño'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    sendRemoteCommand({
                      action: isLocked ? 'unlock' : 'lock',
                      locked: !isLocked,
                      feedbackLabel: isLocked
                        ? '✓ Modo Enfoque desactivado (navegación libre)'
                        : '✓ Modo Enfoque activado en el dispositivo',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    isLocked
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isLocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              </div>
            </div>

            {/* Pie del Panel */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Sincronización periódica activa (2.5s)</span>
              <button
                onClick={() => setIsOpen(false)}
                className="font-bold text-slate-600 hover:text-slate-900"
              >
                Cerrar panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
