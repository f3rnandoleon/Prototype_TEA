'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Shield, Heart, Bell } from 'lucide-react';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';

interface ChildRemoteListenerProps {
  childId: string;
  soundEnabled?: boolean;
}

export const ChildRemoteListener: React.FC<ChildRemoteListenerProps> = ({
  childId,
  soundEnabled = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { speak } = useSpeechSynthesis();

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const lastExecutedCommandId = useRef<string | null>(null);

  // Mapear la ruta actual a un nombre descriptivo en español para el tutor
  const getCurrentSectionName = (path: string): string => {
    if (path.includes('/calm')) return 'Rincón de Calma (Relajación) 🧘';
    if (path.includes('/aac')) return 'Comunicador de Pictogramas (CAA) 🗣️';
    if (path.includes('/schedule')) return 'Mi Día (Agenda Visual) 📅';
    if (path.includes('/activities/')) return 'Actividad en Progreso 🎯';
    if (path.includes('/activities')) return 'Listado de Actividades 🎨';
    return 'Menú Principal Infantil 🏠';
  };

  useEffect(() => {
    let isMounted = true;

    const pollRemoteCommand = async () => {
      try {
        const section = getCurrentSectionName(pathname);
        const res = await fetch(
          `/api/children/${childId}/remote-control?role=child&route=${encodeURIComponent(
            pathname
          )}&section=${encodeURIComponent(section)}`
        );

        if (!res.ok) return;
        const data = await res.json();

        if (!isMounted) return;

        setIsLocked(Boolean(data.locked));

        const command = data.activeCommand;
        if (
          command &&
          command.commandId &&
          command.commandId !== lastExecutedCommandId.current &&
          !command.executedAt
        ) {
          lastExecutedCommandId.current = command.commandId;

          // Confirmar recepción al servidor
          fetch(`/api/children/${childId}/remote-control`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commandId: command.commandId }),
          }).catch(console.error);

          // 1. Mensaje de voz y aviso visual
          if (command.message) {
            setNotificationMessage(command.message);
            if (soundEnabled && command.speakVoice !== false) {
              speak(command.message);
            }
            setTimeout(() => {
              if (isMounted) setNotificationMessage(null);
            }, 4500);
          }

          // 2. Navegación remota forzada por el tutor
          if (command.targetRoute && command.targetRoute !== pathname) {
            // Breve retraso suave para permitir escuchar el mensaje si lo hay
            const delay = command.message ? 800 : 100;
            setTimeout(() => {
              if (isMounted) {
                router.push(command.targetRoute);
              }
            }, delay);
          }
        }
      } catch (err) {
        // Fallos temporales de red en background se ignoran silenciosamente
      }
    };

    // Consulta inicial inmediata
    pollRemoteCommand();

    // Sondeo ligero cada 2.5 segundos
    const interval = setInterval(pollRemoteCommand, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [childId, pathname, router, speak, soundEnabled]);

  return (
    <>
      {/* Notificación suave / Toast de transición enviado por el tutor */}
      {notificationMessage && (
        <div className="fixed top-18 sm:top-20 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-indigo-400/50 max-w-md w-full">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-sm sm:text-base font-black leading-snug">
              {notificationMessage}
            </p>
          </div>
        </div>
      )}

      {/* Indicador discreto de modo guiado / enfoque si está bloqueado por el tutor */}
      {isLocked && (
        <div className="fixed bottom-3 right-3 z-30 pointer-events-none">
          <div className="bg-indigo-900/80 text-indigo-100 text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-sm border border-indigo-400/30 flex items-center gap-1.5 shadow-md">
            <Shield className="w-3 h-3 text-indigo-300" />
            <span>Acompañamiento Guiado Activo</span>
          </div>
        </div>
      )}
    </>
  );
};
