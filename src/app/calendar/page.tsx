'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { DailyPatternTracker } from '@/components/calendar/DailyPatternTracker';
import { NewEventModal } from '@/components/calendar/NewEventModal';
import { IChild, IUser, IScheduleEvent, ISomaticLog, IObservation, IABCLog } from '@/types';

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get('childId');

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || '');

  // Fecha actualmente visualizada en el mes y fecha seleccionada para el registro diario
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [viewMode, setViewMode] = useState<'month' | 'tracker'>('month');

  // Datos obtenidos de la API
  const [events, setEvents] = useState<IScheduleEvent[]>([]);
  const [somaticLogs, setSomaticLogs] = useState<ISomaticLog[]>([]);
  const [observations, setObservations] = useState<IObservation[]>([]);
  const [abcLogs, setAbcLogs] = useState<IABCLog[]>([]);
  const [patternInsights, setPatternInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal para nuevo evento / racha
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>('');

  useEffect(() => {
    loadUserAndChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      // Guardar en localStorage para sincronizar entre módulos
      try {
        localStorage.setItem('tea_selected_child_id', selectedChildId);
      } catch {}
      loadCalendarData(selectedChildId, currentMonthDate);
    }
  }, [selectedChildId, currentMonthDate]);

  const loadUserAndChildren = async () => {
    setIsLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);

      const cRes = await fetch('/api/children');
      if (cRes.ok) {
        const cData = await cRes.json();
        setChildren(cData.children || []);
        if (cData.children?.length > 0 && !selectedChildId) {
          const storedChildId = typeof window !== 'undefined' ? localStorage.getItem('tea_selected_child_id') : null;
          const found = storedChildId && cData.children.some((c: IChild) => c._id === storedChildId);
          setSelectedChildId(found ? (storedChildId as string) : cData.children[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarData = async (childId: string, monthDate: Date) => {
    try {
      const year = monthDate.getFullYear();
      const month = String(monthDate.getMonth() + 1).padStart(2, '0');
      const res = await fetch(`/api/calendar?childId=${childId}&month=${year}-${month}`);

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setSomaticLogs(data.somaticLogs || []);
        setObservations(data.observations || []);
        setAbcLogs(data.abcLogs || []);
        setPatternInsights(data.patternInsights || []);
      }
    } catch (e) {
      console.error('Error al cargar datos del calendario:', e);
    }
  };

  // Guardar factores / síntomas para el día seleccionado
  const handleSaveDay = async (data: {
    symptoms: string[];
    mood: string;
    wellbeingNote?: string;
  }) => {
    if (!selectedChildId) return;

    try {
      const dateStr = selectedDate.toISOString();
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          date: dateStr,
          symptoms: data.symptoms,
          mood: data.mood,
          wellbeingNote: data.wellbeingNote,
        }),
      });

      if (res.ok) {
        // Recargar datos en segundo plano sin interrumpir la interfaz
        loadCalendarData(selectedChildId, currentMonthDate);
      }
    } catch (e) {
      console.error('Error al guardar día:', e);
    }
  };

  // Abrir modal de nuevo evento
  const handleOpenNewEvent = (defaultDateStr?: string) => {
    setModalDefaultDate(defaultDateStr || selectedDate.toISOString().split('T')[0]);
    setShowEventModal(true);
  };

  // Obtener log somático para la fecha seleccionada
  const activeSomaticLog = React.useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return (
      somaticLogs.find((l) => {
        const logDateStr = new Date(l.date).toISOString().split('T')[0];
        return logDateStr === selectedDateStr;
      }) || null
    );
  }, [somaticLogs, selectedDate]);

  // Obtener eventos del día seleccionado
  const dayEvents = React.useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return events.filter((e) => e.date === selectedDateStr);
  }, [events, selectedDate]);

  // Obtener observaciones del día seleccionado
  const dayObservations = React.useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return observations.filter((o) => {
      const oDateStr = new Date(o.date).toISOString().split('T')[0];
      return oDateStr === selectedDateStr;
    });
  }, [observations, selectedDate]);

  // Obtener registros ABC del día seleccionado
  const dayAbcLogs = React.useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return abcLogs.filter((a) => {
      const aDateStr = new Date(a.date).toISOString().split('T')[0];
      return aDateStr === selectedDateStr;
    });
  }, [abcLogs, selectedDate]);

  const selectedChild = children.find((c) => c._id === selectedChildId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-slate-50 to-purple-50/20 text-slate-800 pb-32 md:pb-16">
      <Navbar user={currentUser || undefined} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Barra superior de control y selección de niño optimizada para móvil */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-rose-100">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-rose-100 text-rose-700 shadow-sm shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Calendario y Patrones
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Anticipación visual y seguimiento sensorial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Selector de Niño */}
            {children.length > 0 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="flex-1 sm:w-auto text-xs font-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-rose-200 bg-white shadow-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    Niño: {c.name} {c.nickname ? `(${c.nickname})` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Botón para añadir evento / racha */}
            <Button
              onClick={() => handleOpenNewEvent()}
              variant="primary"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 shadow-sm shrink-0 px-3 py-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Evento</span>
            </Button>
          </div>
        </div>

        {/* Selector de modo de vista para pantallas móviles (Sticky) */}
        <div className="lg:hidden sticky top-16 z-30 py-1 bg-gradient-to-b from-rose-50/80 via-rose-50/60 to-transparent backdrop-blur-sm -mx-3 px-3">
          <div className="flex items-center justify-center p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/80 shadow-md max-w-sm mx-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-[#9f1239] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Vista Mensual</span>
            </button>
            <button
              onClick={() => setViewMode('tracker')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'tracker'
                  ? 'bg-[#9f1239] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Registro Diario</span>
            </button>
          </div>
        </div>

        {/* Contenido principal: Grid de 2 columnas en Desktop o según pestaña en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Vista Mensual (Imagen 1) */}
          <section
            className={`lg:col-span-6 xl:col-span-6 space-y-4 ${
              viewMode === 'tracker' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white/40 backdrop-blur-md rounded-[2.2rem] sm:rounded-[2.8rem] p-1.5 sm:p-4 border border-rose-100 shadow-sm">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Rachas y anticipación mensual</span>
                </span>
                <span className="text-slate-400">
                  {selectedChild ? selectedChild.name : 'Niño'}
                </span>
              </div>

              <CalendarMonthView
                currentDate={currentMonthDate}
                onMonthChange={setCurrentMonthDate}
                selectedDate={selectedDate}
                onSelectDate={(newDate) => {
                  setSelectedDate(newDate);
                  // En pantallas móviles cambiamos a vista tracker para registrar síntomas
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setViewMode('tracker');
                  }
                }}
                events={events}
                somaticLogs={somaticLogs}
                observations={observations}
                abcLogs={abcLogs}
                onOpenNewEventModal={handleOpenNewEvent}
              />
            </div>
          </section>

          {/* COLUMNA DERECHA: Registro de Síntomas y Detección de Patrones (Imagen 2) */}
          <section
            className={`lg:col-span-6 xl:col-span-6 ${
              viewMode === 'month' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white/70 backdrop-blur-md rounded-[2.2rem] sm:rounded-[2.8rem] p-4 sm:p-7 border border-rose-100 shadow-xl shadow-rose-100/30">
              <DailyPatternTracker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                somaticLog={activeSomaticLog}
                dayEvents={dayEvents}
                dayObservations={dayObservations}
                dayAbcLogs={dayAbcLogs}
                childId={selectedChildId}
                onRefreshData={() => loadCalendarData(selectedChildId, currentMonthDate)}
                onSaveDay={handleSaveDay}
                patternInsights={patternInsights}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Modal para crear evento o racha */}
      {selectedChildId && (
        <NewEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          childId={selectedChildId}
          defaultDate={modalDefaultDate}
          onEventCreated={() => loadCalendarData(selectedChildId, currentMonthDate)}
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
          Cargando calendario...
        </div>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
