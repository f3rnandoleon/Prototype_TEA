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
import { DayEvolutionRecords } from '@/components/calendar/DayEvolutionRecords';
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

  // Función de comparación precisa de fechas entre strings YYYY-MM-DD y Date
  const isSameCalendarDay = (d1: Date | string, d2: Date | string): boolean => {
    if (!d1 || !d2) return false;
    if (typeof d1 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d1)) {
      if (typeof d2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d2)) {
        return d1 === d2;
      }
      const d2Obj = typeof d2 === 'string' ? new Date(d2) : d2;
      if (isNaN(d2Obj.getTime())) return false;
      const y2 = d2Obj.getFullYear();
      const m2 = String(d2Obj.getMonth() + 1).padStart(2, '0');
      const day2 = String(d2Obj.getDate()).padStart(2, '0');
      if (d1 === `${y2}-${m2}-${day2}`) return true;
      try {
        if (d1 === d2Obj.toISOString().split('T')[0]) return true;
      } catch {}
      return false;
    }

    if (typeof d2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d2)) {
      return isSameCalendarDay(d2, d1);
    }

    const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
    const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

    const matchLocal =
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
    if (matchLocal) return true;

    const matchUtc =
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate();
    if (matchUtc) return true;

    try {
      return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
    } catch {
      return false;
    }
  };

  // Manejador de selección de fecha (sincroniza selección y mes si es necesario)
  const handleSelectDate = (newDate: Date) => {
    setSelectedDate(newDate);
    if (
      newDate.getFullYear() !== currentMonthDate.getFullYear() ||
      newDate.getMonth() !== currentMonthDate.getMonth()
    ) {
      setCurrentMonthDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  // Obtener log somático para la fecha seleccionada
  const activeSomaticLog = React.useMemo(() => {
    return somaticLogs.find((l) => isSameCalendarDay(l.date, selectedDate)) || null;
  }, [somaticLogs, selectedDate]);

  // Obtener eventos del día seleccionado
  const dayEvents = React.useMemo(() => {
    return events.filter((e) => isSameCalendarDay(e.date, selectedDate));
  }, [events, selectedDate]);

  // Obtener observaciones del día seleccionado
  const dayObservations = React.useMemo(() => {
    return observations.filter((o) => isSameCalendarDay(o.date, selectedDate));
  }, [observations, selectedDate]);

  // Obtener registros ABC del día seleccionado
  const dayAbcLogs = React.useMemo(() => {
    return abcLogs.filter((a) => isSameCalendarDay(a.date, selectedDate));
  }, [abcLogs, selectedDate]);

  const selectedChild = children.find((c) => c._id === selectedChildId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32 md:pb-16">
      <Navbar user={currentUser || undefined} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Barra superior de control y selección de niño optimizada para móvil */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shadow-sm shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Calendario y Anticipación Sensorial
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Planificación estructurada, sesiones y monitoreo del bienestar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Selector de Niño */}
            {children.length > 0 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="flex-1 sm:w-auto text-xs font-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    Niño: {c.name} {c.nickname ? `(${c.nickname})` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Botón para añadir evento / anticipación */}
            <Button
              onClick={() => handleOpenNewEvent()}
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-sm shrink-0 px-3.5 py-2 text-xs rounded-2xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Evento o Período</span>
            </Button>
          </div>
        </div>

        {/* Selector de modo de vista para pantallas móviles (Sticky) */}
        <div className="lg:hidden sticky top-16 z-30 py-1 bg-slate-50/90 backdrop-blur-md -mx-3 px-3">
          <div className="flex items-center justify-center p-1 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-sm mx-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Vista Mensual y Registros</span>
            </button>
            <button
              onClick={() => setViewMode('tracker')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Factores Sensoriales</span>
            </button>
          </div>
        </div>

        {/* Contenido principal: Grid de 2 columnas en Desktop o según pestaña en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Vista Mensual y Evolución del Día Debajo */}
          <section
            className={`lg:col-span-7 xl:col-span-7 space-y-6 ${
              viewMode === 'tracker' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* 1. Calendario de Vista Mensual */}
            <div className="bg-white rounded-[2.2rem] sm:rounded-[2.8rem] p-2 sm:p-4 border border-slate-200/80 shadow-sm">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-100 mb-2">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Períodos de anticipación y agenda</span>
                </span>
                <span className="text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {selectedChild ? selectedChild.name : 'Estudiante'}
                </span>
              </div>

              <CalendarMonthView
                currentDate={currentMonthDate}
                onMonthChange={setCurrentMonthDate}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                events={events}
                somaticLogs={somaticLogs}
                observations={observations}
                abcLogs={abcLogs}
                onOpenNewEventModal={handleOpenNewEvent}
              />
            </div>

            {/* 2. EVOLUCIÓN Y REGISTROS DEL DÍA DEBAJO DEL CALENDARIO */}
            <DayEvolutionRecords
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              childId={selectedChildId}
              childName={selectedChild?.name || 'Estudiante'}
              dayEvents={dayEvents}
              dayObservations={dayObservations}
              dayAbcLogs={dayAbcLogs}
              somaticLog={activeSomaticLog}
              onRefreshData={() => loadCalendarData(selectedChildId, currentMonthDate)}
              onOpenNewEventModal={handleOpenNewEvent}
              onOpenSensoryTracker={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setViewMode('tracker');
                } else {
                  const el = document.getElementById('daily-pattern-tracker-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </section>

          {/* COLUMNA DERECHA: Registro Sensorial y Factores Diarios */}
          <section
            id="daily-pattern-tracker-section"
            className={`lg:col-span-5 xl:col-span-5 ${
              viewMode === 'month' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white rounded-[2.2rem] sm:rounded-[2.8rem] p-4 sm:p-7 border border-slate-200/80 shadow-sm">
              <DailyPatternTracker
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
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
