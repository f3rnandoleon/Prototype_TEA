'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  Sparkles,
  Trash2,
  Edit,
  ArrowRight,
  Baby,
  AlertCircle,
  HelpCircle,
  Sun,
  Sunset,
  Moon,
  School,
  Smile,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IChild,
  IRoutine,
  IRoutineStep,
  IUser,
  RoutineCategory,
  IScheduleEvent,
  IPlanChange,
} from '@/types';

function RoutinesAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get('childId');

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || '');
  const [activeTab, setActiveTab] = useState<'routines' | 'events' | 'planChange' | 'breaks'>('routines');

  const [routines, setRoutines] = useState<IRoutine[]>([]);
  const [events, setEvents] = useState<IScheduleEvent[]>([]);
  const [activePlanChange, setActivePlanChange] = useState<IPlanChange | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal crear/editar rutina
  const [showModal, setShowModal] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineCategory, setRoutineCategory] = useState<RoutineCategory>('manana');
  const [routineTime, setRoutineTime] = useState('08:00');
  const [routineDays, setRoutineDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lunes a Viernes
  const [steps, setSteps] = useState<IRoutineStep[]>([
    {
      id: 'step-1',
      order: 1,
      title: 'Despertar y levantarse',
      iconUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false',
      estimatedMinutes: 5,
    },
    {
      id: 'step-2',
      order: 2,
      title: 'Lavarse la cara y dientes',
      iconUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false',
      estimatedMinutes: 10,
    },
    {
      id: 'step-3',
      order: 3,
      title: 'Tomar desayuno',
      iconUrl: 'https://api.arasaac.org/api/pictograms/2422?download=false',
      estimatedMinutes: 20,
    },
  ]);

  // Modal y formulario de Evento no rutinario
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('10:00');
  const [eventEmoji, setEventEmoji] = useState('🏥');
  const [eventDesc, setEventDesc] = useState('');
  const [eventPrepNotes, setEventPrepNotes] = useState('');
  const [eventAlertLevel, setEventAlertLevel] = useState<'informativo' | 'importante' | 'cambio_fuerte'>('importante');

  // Formulario Cambio de Planes Activo
  const [origActivity, setOrigActivity] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [nextActivity, setNextActivity] = useState('');
  const [childOptionsStr, setChildOptionsStr] = useState('Dibujar, Escuchar música');
  const [changeReason, setChangeReason] = useState('');

  // Configuración de pausas sugeridas
  const [pauseIntervalMinutes, setPauseIntervalMinutes] = useState(45);
  const [pauseDurationMinutes, setPauseDurationMinutes] = useState(10);
  const [pauseSavedMessage, setPauseSavedMessage] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildPlanningData(selectedChildId);
    }
  }, [selectedChildId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);

      const childrenRes = await fetch('/api/children');
      if (childrenRes.ok) {
        const cData = await childrenRes.json();
        setChildren(cData.children || []);
        if (cData.children?.length > 0 && !selectedChildId) {
          setSelectedChildId(cData.children[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildPlanningData = async (childId: string) => {
    try {
      // 1. Rutinas
      const resRoutines = await fetch(`/api/routines?childId=${childId}`);
      if (resRoutines.ok) {
        const data = await resRoutines.json();
        setRoutines(data.routines || []);
      }

      // 2. Eventos especiales
      const resEvents = await fetch(`/api/schedule/events?childId=${childId}`);
      if (resEvents.ok) {
        const data = await resEvents.json();
        setEvents(data.events || []);
      }

      // 3. Cambio de plan activo
      const resPlan = await fetch(`/api/schedule/plan-change?childId=${childId}`);
      if (resPlan.ok) {
        const data = await resPlan.json();
        setActivePlanChange(data.activeChange || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !routineTitle.trim()) return;

    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          title: routineTitle,
          category: routineCategory,
          startTime: routineTime,
          daysOfWeek: routineDays,
          steps,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setRoutineTitle('');
        loadChildPlanningData(selectedChildId);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar rutina');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm('¿Deseas eliminar esta rutina?')) return;
    try {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadChildPlanningData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !eventTitle.trim()) return;

    try {
      const res = await fetch('/api/schedule/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          title: eventTitle,
          date: eventDate,
          startTime: eventTime,
          iconEmoji: eventEmoji,
          description: eventDesc,
          visualPrepNotes: eventPrepNotes,
          alertLevel: eventAlertLevel,
          isNonRoutine: true,
        }),
      });

      if (res.ok) {
        setShowEventModal(false);
        setEventTitle('');
        setEventDesc('');
        setEventPrepNotes('');
        loadChildPlanningData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento programado?')) return;
    try {
      const res = await fetch(`/api/schedule/events?eventId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadChildPlanningData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnnouncePlanChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !origActivity.trim() || !newActivity.trim()) return;

    try {
      const res = await fetch('/api/schedule/plan-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          originalActivity: origActivity,
          newTask: newActivity,
          nextTask: nextActivity,
          childOptions: childOptionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          reasonNotes: changeReason,
        }),
      });

      if (res.ok) {
        setOrigActivity('');
        setNewActivity('');
        setNextActivity('');
        setChangeReason('');
        loadChildPlanningData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivatePlanChange = async () => {
    if (!activePlanChange) return;
    try {
      const res = await fetch('/api/schedule/plan-change', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activePlanChange._id, isActive: false }),
      });
      if (res.ok) {
        loadChildPlanningData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    setSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        order: nextOrder,
        title: `Paso ${nextOrder}`,
        iconUrl: 'https://api.arasaac.org/api/pictograms/2418?download=false',
        estimatedMinutes: 10,
      },
    ]);
  };

  const handleUpdateStep = (index: number, field: keyof IRoutineStep, value: unknown) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDay = (day: number) => {
    setRoutineDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const daysLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const categoryIcons = {
    manana: <Sun className="w-4 h-4 text-amber-500" />,
    tarde: <Sunset className="w-4 h-4 text-orange-500" />,
    noche: <Moon className="w-4 h-4 text-indigo-500" />,
    escuela: <School className="w-4 h-4 text-sky-500" />,
    higiene: <Smile className="w-4 h-4 text-emerald-500" />,
    especial: <Sparkles className="w-4 h-4 text-purple-500" />,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera Principal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-emerald-600" />
              <span>Calendario de Planificación y Anticipación</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Anticipación visual, rutinas estructuradas, eventos especiales y gestión amable de cambios imprevistos.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {children.length > 0 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    Niño: {c.name} {c.nickname ? `(${c.nickname})` : ''}
                  </option>
                ))}
              </select>
            )}

            {activeTab === 'routines' && (
              <Button
                onClick={() => setShowModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Rutina</span>
              </Button>
            )}

            {activeTab === 'events' && (
              <Button
                onClick={() => setShowEventModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Evento</span>
              </Button>
            )}
          </div>
        </div>

        {/* Pestañas del Módulo 1 */}
        <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('routines')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'routines'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Rutinas Habituales ({routines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-indigo-600 text-indigo-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Eventos no rutinarios y Alertas ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('planChange')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'planChange'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>«Cambio de Planes» {activePlanChange ? '(1 Activo)' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('breaks')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'breaks'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Pausas Sugeridas</span>
          </button>
        </div>

        {/* PESTAÑA 1: RUTINAS HABITUALES */}
        {activeTab === 'routines' && (
          <section>
            {routines.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">No hay rutinas creadas para este perfil</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Crea rutinas para la mañana, la escuela o la noche con pasos ilustrados.
                </p>
                <Button onClick={() => setShowModal(true)} variant="primary" size="md">
                  Crear Primera Rutina
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routines.map((routine) => (
                  <div
                    key={routine._id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            {categoryIcons[routine.category] || <Calendar className="w-5 h-5 text-emerald-600" />}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-800">{routine.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{routine.startTime || '08:00'}</span>
                              <span>•</span>
                              <span className="capitalize">{routine.category}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteRoutine(routine._id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                          title="Eliminar rutina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Días activos */}
                      <div className="flex gap-1 mt-4">
                        {daysLabels.map((lbl, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              routine.daysOfWeek.includes(idx)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>

                      {/* Pasos ilustrados */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          Pasos ({routine.steps.length}):
                        </span>
                        <div className="space-y-2 mt-2">
                          {routine.steps.map((step, idx) => (
                            <div
                              key={step.id || idx}
                              className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-100"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              {step.iconUrl && (
                                <img
                                  src={step.iconUrl}
                                  alt=""
                                  className="w-8 h-8 object-contain pointer-events-none"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-slate-800 truncate">{step.title}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                {step.estimatedMinutes} min
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/child/${selectedChildId}/schedule`}
                        className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <span>Ver cómo lo ve el niño en "Mi Día"</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 2: EVENTOS NO RUTINARIOS Y ANTICIPACIÓN */}
        {activeTab === 'events' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/70 border border-indigo-200 p-5 rounded-3xl">
              <div>
                <h3 className="font-black text-indigo-950 text-lg flex items-center gap-2">
                  <span>Anticipación de Salidas, Citas y Cambios de Horario</span>
                </h3>
                <p className="text-xs text-indigo-800 mt-1 max-w-2xl font-medium">
                  Los eventos fuera de la rutina pueden generar incertidumbre. Registrar estos eventos con anticipación permite al niño verlos en su agenda visual y prepararse emocionalmente.
                </p>
              </div>

              <Button
                onClick={() => setShowEventModal(true)}
                variant="primary"
                size="md"
                className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Nuevo Evento</span>
              </Button>
            </div>

            {events.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">No hay eventos especiales programados</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Programa citas médicas, excursiones escolares o eventos familiares con apoyos visuales anticipados.
                </p>
                <Button onClick={() => setShowEventModal(true)} variant="primary" size="sm">
                  Programar Evento Especial
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 rounded-2xl bg-indigo-50 border border-indigo-100">
                            {ev.iconEmoji || '📅'}
                          </span>
                          <div>
                            <h4 className="font-black text-slate-900 text-base">{ev.title}</h4>
                            <p className="text-xs text-slate-500 font-bold">
                              {ev.date} • {ev.startTime}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(ev._id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Eliminar evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {ev.description && (
                        <p className="text-xs text-slate-600 mt-3 font-medium">{ev.description}</p>
                      )}

                      {ev.visualPrepNotes && (
                        <div className="mt-3 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                          💡 Apoyo anticipado: {ev.visualPrepNotes}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span className="capitalize">Nivel: {ev.alertLevel}</span>
                      <span>Por: {ev.creatorRole || 'Equipo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 3: CAMBIO DE PLANES ACTIVO */}
        {activeTab === 'planChange' && (
          <section className="space-y-6 max-w-3xl mx-auto">
            {/* Si ya hay un cambio activo */}
            {activePlanChange ? (
              <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-400 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">⭐</span>
                    <div>
                      <span className="text-xs font-black uppercase text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                        Cambio de planes activo en el dispositivo del niño
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-1">
                        No se hará: <span className="line-through">{activePlanChange.originalActivity}</span>
                      </h3>
                      <p className="text-sm font-black text-emerald-800">
                        En su lugar: {activePlanChange.newTask}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleDeactivatePlanChange}
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    Desactivar y Cerrar
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-4 rounded-2xl border border-amber-200">
                  <div>
                    <span className="font-bold text-slate-500 uppercase">Lo que pasará después:</span>
                    <p className="font-black text-slate-800 mt-0.5">{activePlanChange.nextTask || 'Rutina normal'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase">Opciones ofrecidas al niño:</span>
                    <p className="font-black text-slate-800 mt-0.5">
                      {activePlanChange.childOptions?.join(', ') || 'Ninguna predefinida'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-amber-900/80 font-medium">
                  Este aviso aparece de forma destacada y amable en la vista «Mi Día» del niño, con apoyo de voz para evitar angustia ante la transición.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>No hay ningún cambio de planes activo en este momento. Si surge un imprevisto hoy, comunícalo aquí abajo:</span>
              </div>
            )}

            {/* Formulario para publicar nuevo cambio de planes */}
            <div className="bg-white p-6 sm:p-8 rounded-4xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {activePlanChange ? 'Actualizar o Publicar Otro Cambio de Planes' : 'Anunciar un Cambio de Planes al Niño'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Estructura la información para que el niño entienda claramente: qué se canceló, qué haremos ahora y qué opciones tiene.
                </p>
              </div>

              <form onSubmit={handleAnnouncePlanChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    1. ¿Qué actividad cambió o no se realizará? (❌ Lo que no haremos)
                  </label>
                  <input
                    type="text"
                    required
                    value={origActivity}
                    onChange={(e) => setOrigActivity(e.target.value)}
                    placeholder="Ej. Ir a la piscina municipal"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    2. ¿Qué actividad haremos en su lugar? (⭐ Lo que haremos ahora)
                  </label>
                  <input
                    type="text"
                    required
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Ej. Jugar con plastilina y bloques en el aula"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    3. ¿Qué sucederá después de esto? (⏭️ Lo que pasará después)
                  </label>
                  <input
                    type="text"
                    value={nextActivity}
                    onChange={(e) => setNextActivity(e.target.value)}
                    placeholder="Ej. Tomar la merienda con nuestros compañeros"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    4. Opciones que el niño puede elegir (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={childOptionsStr}
                    onChange={(e) => setChildOptionsStr(e.target.value)}
                    placeholder="Ej. Escuchar música, Dibujar, Armar puzzle"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dar opciones controladas devuelve al niño la sensación de agencia y reduce la ansiedad ante imprevistos.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-black rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-md py-3.5"
                >
                  Publicar Cambio en la Agenda del Niño
                </Button>
              </form>
            </div>
          </section>
        )}

        {/* PESTAÑA 4: PAUSAS SUGERIDAS CONFIGURABLES */}
        {activeTab === 'breaks' && (
          <section className="bg-white p-6 sm:p-8 rounded-4xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Coffee className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-black text-slate-800">
                  Configuración de Pausas y Descansos Sugeridos
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Recordatorios y sugerencias amables, no imposiciones forzadas. Diseñadas para prevenir la sobrecarga sensorial antes de que ocurra.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Intervalo sugerido de descanso entre actividades intensas
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={pauseIntervalMinutes}
                    onChange={(e) => setPauseIntervalMinutes(Number(e.target.value))}
                    className="flex-1 accent-teal-600"
                  />
                  <span className="font-black text-sm text-slate-800 w-16 text-right">
                    {pauseIntervalMinutes} min
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Frecuencia con la que se ofrece una sugerencia sutil de relajación o agua.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Duración recomendada de la pausa
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={pauseDurationMinutes}
                    onChange={(e) => setPauseDurationMinutes(Number(e.target.value))}
                    className="flex-1 accent-teal-600"
                  />
                  <span className="font-black text-sm text-slate-800 w-16 text-right">
                    {pauseDurationMinutes} min
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 font-medium">
                  <strong>Principio neuroafirmativo:</strong> Si el niño se encuentra concentrado en un hiperfoco positivo y regulador, la plataforma no bloquea la pantalla. Siempre deja la opción voluntaria de continuar o descansar.
                </div>
              </div>

              <Button
                onClick={() => {
                  setPauseSavedMessage(true);
                  setTimeout(() => setPauseSavedMessage(false), 2500);
                }}
                variant="primary"
                size="md"
                className="font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {pauseSavedMessage ? '¡Preferencia guardada!' : 'Guardar Preferencias de Pausa'}
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* MODAL: Crear Rutina */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Nueva Rutina Diaria</h2>
            <p className="text-xs text-slate-500 mb-6">
              Define los pasos ilustrados con tiempos estimados para estructurar el día.
            </p>

            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título de la Rutina
                </label>
                <input
                  type="text"
                  required
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="Ej. Rutina de la Mañana"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <select
                    value={routineCategory}
                    onChange={(e) => setRoutineCategory(e.target.value as RoutineCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                    <option value="escuela">Escuela</option>
                    <option value="higiene">Higiene</option>
                    <option value="especial">Especial / Salida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hora de Inicio Prevista
                  </label>
                  <input
                    type="time"
                    value={routineTime}
                    onChange={(e) => setRoutineTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Días de la semana */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Días de Repetición Semanal
                </label>
                <div className="flex gap-2">
                  {daysLabels.map((lbl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        routineDays.includes(idx)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pasos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Pasos Ilustrados de la Rutina
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar paso</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {steps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                        placeholder="Nombre del paso"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                      <input
                        type="number"
                        value={step.estimatedMinutes || 10}
                        onChange={(e) => handleUpdateStep(idx, 'estimatedMinutes', Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-center"
                        title="Minutos estimados"
                      />
                      <span className="text-slate-400 text-[11px]">min</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Guardar Rutina
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Programar Evento Especial / Salida */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Programar Evento Especial</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Agrega una salida, cita o cambio temporal con apoyos de anticipación.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título del Evento
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ej. Visita al Odontólogo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emoji</label>
                  <select
                    value={eventEmoji}
                    onChange={(e) => setEventEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="🏥">🏥 Médico</option>
                    <option value="🚌">🚌 Paseo</option>
                    <option value="🎂">🎂 Fiesta</option>
                    <option value="🎒">🎒 Escuela</option>
                    <option value="🛒">🛒 Compras</option>
                    <option value="🎨">🎨 Taller</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hora</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nivel de Alerta / Magnitud del Cambio
                </label>
                <select
                  value={eventAlertLevel}
                  onChange={(e) => setEventAlertLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="informativo">Informativo (Cita habitual o conocida)</option>
                  <option value="importante">Importante (Lugar nuevo o estímulos desconocidos)</option>
                  <option value="cambio_fuerte">Cambio Fuerte (Interrupción significativa del horario)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Apoyos de Preparación Anticipada
                </label>
                <input
                  type="text"
                  value={eventPrepNotes}
                  onChange={(e) => setEventPrepNotes(e.target.value)}
                  placeholder="Ej. Llevar audífonos de reducción de ruido y su juguete favorito"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowEventModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold bg-indigo-600 hover:bg-indigo-700">
                  Guardar Evento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoutinesAdminPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando planificación...</div>}>
      <RoutinesAdminContent />
    </Suspense>
  );
}
