'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Plus,
  Target,
  Calendar,
  Sparkles,
  Heart,
  Smile,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Coffee,
  Moon,
  BarChart3,
  Filter,
  Check,
  Info,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IChild,
  IObservation,
  IGoal,
  IUser,
  ISomaticLog,
  IABCLog,
  IBatteryLog,
  IScheduleEvent,
  ObservationCategory,
  GoalArea,
  GoalStatus,
  SleepQuality,
  AppetiteLevel,
  DiscomfortLevel,
} from '@/types';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get('childId');

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || '');
  const [activeTab, setActiveTab] = useState<'timeline' | 'abc' | 'somatic' | 'goals' | 'reports'>('timeline');

  const [observations, setObservations] = useState<IObservation[]>([]);
  const [abcLogs, setAbcLogs] = useState<IABCLog[]>([]);
  const [somaticLogs, setSomaticLogs] = useState<ISomaticLog[]>([]);
  const [batteryLogs, setBatteryLogs] = useState<IBatteryLog[]>([]);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<IScheduleEvent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtro de categoría en la línea de tiempo (incluye eventos de calendario)
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'obs' | 'abc' | 'somatic' | 'battery' | 'events'>('all');

  // Modal nueva observación general
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsCategory, setObsCategory] = useState<ObservationCategory>('bienestar');
  const [obsDescription, setObsDescription] = useState('');
  const [obsSupports, setObsSupports] = useState('');
  const [obsOutcome, setObsOutcome] = useState('');
  const [obsDate, setObsDate] = useState<string>('');
  const [obsEventId, setObsEventId] = useState<string>('');

  // Modal nuevo registro ABC neuroafirmativo
  const [showABCModal, setShowABCModal] = useState(false);
  const [abcAntecedent, setAbcAntecedent] = useState('');
  const [abcBehavior, setAbcBehavior] = useState('');
  const [abcUnmetNeed, setAbcUnmetNeed] = useState('');
  const [abcSupport, setAbcSupport] = useState('');
  const [abcOutcome, setAbcOutcome] = useState('');

  // Modal nueva bitácora somática
  const [showSomaticModal, setShowSomaticModal] = useState(false);
  const [somaticSleepHours, setSomaticSleepHours] = useState<number>(8);
  const [somaticSleepQuality, setSomaticSleepQuality] = useState<SleepQuality>('bueno');
  const [somaticAppetite, setSomaticAppetite] = useState<AppetiteLevel>('normal');
  const [somaticDiscomfort, setSomaticDiscomfort] = useState<DiscomfortLevel>('ninguno');
  const [somaticDiscomfortNotes, setSomaticDiscomfortNotes] = useState('');
  const [somaticWellbeingNote, setSomaticWellbeingNote] = useState('');

  // Modal nuevo objetivo PEI/IEP
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDesc, setGoalDesc] = useState('');
  const [goalArea, setGoalArea] = useState<GoalArea>('comunicacion');
  const [goalCriteria, setGoalCriteria] = useState('');

  // Formulario nota de avance en objetivo
  const [selectedGoalForNote, setSelectedGoalForNote] = useState<string | null>(null);
  const [progressNoteText, setProgressNoteText] = useState('');

  useEffect(() => {
    loadUserAndChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      try {
        localStorage.setItem('tea_selected_child_id', selectedChildId);
      } catch {}
      loadAllTrackingData(selectedChildId);
    }
  }, [selectedChildId]);

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
          const stored = typeof window !== 'undefined' ? localStorage.getItem('tea_selected_child_id') : null;
          const found = stored && cData.children.some((c: IChild) => c._id === stored);
          setSelectedChildId(found ? (stored as string) : cData.children[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllTrackingData = async (childId: string) => {
    try {
      // 1. Observaciones
      fetch(`/api/observations?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setObservations(d.observations || []))
        .catch((e) => console.error(e));

      // 2. Registros ABC
      fetch(`/api/tracking/abc?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setAbcLogs(d.logs || []))
        .catch((e) => console.error(e));

      // 3. Bitácora somática
      fetch(`/api/tracking/somatic?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setSomaticLogs(d.logs || []))
        .catch((e) => console.error(e));

      // 4. Batería sensorial
      fetch(`/api/tracking/battery?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setBatteryLogs(d.logs || []))
        .catch((e) => console.error(e));

      // 5. Objetivos
      fetch(`/api/goals?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setGoals(d.goals || []))
        .catch((e) => console.error(e));

      // 6. Resumen descriptivo
      fetch(`/api/tracking/summary?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setSummary(d.summary || null))
        .catch((e) => console.error(e));

      // 7. Eventos y sesiones de calendario programados
      fetch(`/api/schedule/events?childId=${childId}`)
        .then((r) => r.json())
        .then((d) => setScheduleEvents(d.events || []))
        .catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !obsDescription.trim()) return;

    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          category: obsCategory,
          description: obsDescription,
          supportsUsed: obsSupports.split(',').map((s) => s.trim()).filter(Boolean),
          observedOutcome: obsOutcome,
          date: obsDate ? new Date(obsDate).toISOString() : undefined,
          scheduleEventId: obsEventId || undefined,
        }),
      });

      if (res.ok) {
        setShowObsModal(false);
        setObsDescription('');
        setObsSupports('');
        setObsOutcome('');
        setObsDate('');
        setObsEventId('');
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateABCLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !abcAntecedent.trim() || !abcBehavior.trim() || !abcSupport.trim()) return;

    try {
      const res = await fetch('/api/tracking/abc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          antecedentContext: abcAntecedent,
          observedBehavior: abcBehavior,
          unmetNeed: abcUnmetNeed,
          supportProvided: abcSupport,
          outcome: abcOutcome || 'Regulación alcanzada con apoyo',
        }),
      });

      if (res.ok) {
        setShowABCModal(false);
        setAbcAntecedent('');
        setAbcBehavior('');
        setAbcUnmetNeed('');
        setAbcSupport('');
        setAbcOutcome('');
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSomaticLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    try {
      const res = await fetch('/api/tracking/somatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          sleepHours: somaticSleepHours,
          sleepQuality: somaticSleepQuality,
          appetite: somaticAppetite,
          physicalDiscomfort: somaticDiscomfort,
          discomfortNotes: somaticDiscomfortNotes,
          wellbeingNote: somaticWellbeingNote,
        }),
      });

      if (res.ok) {
        setShowSomaticModal(false);
        setSomaticDiscomfortNotes('');
        setSomaticWellbeingNote('');
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !goalDesc.trim() || !goalCriteria.trim()) return;

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          description: goalDesc,
          area: goalArea,
          criteria: goalCriteria,
        }),
      });

      if (res.ok) {
        setShowGoalModal(false);
        setGoalDesc('');
        setGoalCriteria('');
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProgressNote = async (goalId: string) => {
    if (!progressNoteText.trim()) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newNote: progressNoteText,
        }),
      });

      if (res.ok) {
        setSelectedGoalForNote(null);
        setProgressNoteText('');
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: GoalStatus) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadAllTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Construir línea temporal unificada
  interface TimelineItem {
    id: string;
    type: 'obs' | 'abc' | 'somatic' | 'battery';
    date: Date;
    title: string;
    subtitle?: string;
    badge: { label: string; bg: string; text: string };
    author?: string;
    content: React.ReactNode;
  }

  const timelineItems: TimelineItem[] = [];

  // Agregar observaciones
  if (timelineFilter === 'all' || timelineFilter === 'obs') {
    observations.forEach((o) => {
      timelineItems.push({
        id: `obs-${o._id}`,
        type: 'obs',
        date: new Date(o.date),
        title: `Observación: ${o.category.toUpperCase()}`,
        badge: { label: 'Observación', bg: 'bg-sky-100', text: 'text-sky-800' },
        author: o.author?.name || 'Equipo',
        content: (
          <div className="space-y-1 text-xs">
            <p className="text-slate-800 font-medium">{o.description}</p>
            {o.supportsUsed.length > 0 && (
              <p className="text-slate-500 font-bold">
                💡 Apoyos: {o.supportsUsed.join(', ')}
              </p>
            )}
            {o.observedOutcome && (
              <p className="text-emerald-700 font-bold">⭐ Resultado: {o.observedOutcome}</p>
            )}
          </div>
        ),
      });
    });
  }

  // Agregar registros ABC
  if (timelineFilter === 'all' || timelineFilter === 'abc') {
    abcLogs.forEach((a) => {
      timelineItems.push({
        id: `abc-${a._id}`,
        type: 'abc',
        date: new Date(a.date),
        title: 'Registro ABC Contextual',
        badge: { label: 'Registro ABC', bg: 'bg-purple-100', text: 'text-purple-800' },
        author: a.author?.name || 'Profesional/Tutor',
        content: (
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-700">A (Antecedente/Entorno):</strong> {a.antecedentContext}
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-700">B (Expresión/Conducta):</strong> {a.observedBehavior}
              {a.unmetNeed && <span className="text-amber-800 block mt-0.5">⚠️ Necesidad no atendida: {a.unmetNeed}</span>}
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <strong>C (Apoyo y Resultado):</strong> {a.supportProvided} → <em>{a.outcome}</em>
            </div>
          </div>
        ),
      });
    });
  }

  // Agregar bitácora somática
  if (timelineFilter === 'all' || timelineFilter === 'somatic') {
    somaticLogs.forEach((s) => {
      timelineItems.push({
        id: `som-${s._id}`,
        type: 'somatic',
        date: new Date(s.date),
        title: 'Bitácora Fisiológica y Somática',
        badge: { label: 'Somático', bg: 'bg-teal-100', text: 'text-teal-800' },
        author: s.author?.name || 'Familia',
        content: (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-bold">Sueño:</span>
              <span className="font-black text-slate-800">{s.sleepHours ?? 'N/A'} hrs ({s.sleepQuality})</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-bold">Apetito:</span>
              <span className="font-black text-slate-800 capitalize">{s.appetite}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-bold">Molestia física:</span>
              <span className="font-black text-slate-800 capitalize">{s.physicalDiscomfort}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-bold">Bienestar:</span>
              <span className="font-bold text-slate-800">{s.wellbeingNote || 'Normal'}</span>
            </div>
          </div>
        ),
      });
    });
  }

  // Agregar batería sensorial
  if (timelineFilter === 'all' || timelineFilter === 'battery') {
    batteryLogs.forEach((b) => {
      const batteryBadges: Record<string, { label: string; emoji: string }> = {
        comodo: { label: 'Cómodo y tranquilo', emoji: '😊' },
        cansado: { label: 'Un poco cansado', emoji: '🥱' },
        pausa: { label: 'Necesita una pausa', emoji: '☕' },
        sobrecarga: { label: 'Muchos estímulos / Sobrecarga', emoji: '⚡' },
      };
      const info = batteryBadges[b.level] || { label: b.level, emoji: '🌱' };
      timelineItems.push({
        id: `bat-${b._id}`,
        type: 'battery',
        date: new Date(b.createdAt),
        title: `Termómetro Sensorial: ${info.emoji} ${info.label}`,
        badge: { label: 'Termómetro', bg: 'bg-amber-100', text: 'text-amber-800' },
        author: b.authorName || (b.registeredBy === 'child' ? 'Niño (Autorregistro)' : 'Adulto'),
        content: (
          <p className="text-xs text-slate-600 font-medium">
            {b.note || 'Reporte de estado de energía y carga sensorial.'}
          </p>
        ),
      });
    });
  }

  // Agregar eventos y sesiones del calendario (Calendario reflejado en Seguimiento y Evolución)
  if (timelineFilter === 'all' || timelineFilter === 'events') {
    scheduleEvents.forEach((ev) => {
      const eventDate = new Date(`${ev.date}T${ev.startTime || '10:00'}:00`);
      timelineItems.push({
        id: `event-${ev._id}`,
        type: 'obs',
        date: eventDate,
        title: `${ev.iconEmoji || '📅'} ${ev.title}`,
        subtitle: ev.startTime ? `Hora: ${ev.startTime}` : undefined,
        badge: {
          label: ev.badgeLabel || 'Calendario',
          bg: ev.badgeColor === 'purple' ? 'bg-purple-100' : ev.badgeColor === 'rose' ? 'bg-rose-100' : 'bg-sky-100',
          text: ev.badgeColor === 'purple' ? 'text-purple-800' : ev.badgeColor === 'rose' ? 'text-rose-800' : 'text-sky-800',
        },
        author: ev.creatorRole ? `Programado (${ev.creatorRole})` : 'Agenda',
        content: (
          <div className="space-y-2 text-xs">
            {ev.description && <p className="text-slate-700">{ev.description}</p>}
            {ev.visualPrepNotes && (
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900 font-medium">
                💡 Preparación visual y sensorial: {ev.visualPrepNotes}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setObsDescription(`Evolución en sesión: ${ev.title}. `);
                  setObsDate(ev.date);
                  setObsEventId(ev._id);
                  setShowObsModal(true);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                📝 Registrar evolución de esta sesión
              </button>
              <Link
                href={`/calendar?childId=${selectedChildId}`}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold hover:underline flex items-center gap-1"
              >
                <span>Ver en Calendario</span>
              </Link>
            </div>
          </div>
        ),
      });
    });
  }

  // Ordenar cronológicamente descendente
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  const areaLabels: Record<GoalArea, string> = {
    comunicacion: '🗣️ Comunicación',
    autonomia: '🌟 Autonomía',
    social: '👥 Social',
    cognitiva: '🧠 Cognitiva',
    sensorial: '🌿 Regulación Sensorial',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera Principal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-sky-600" />
              <span>Seguimiento y Evolución</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Línea temporal enriquecida, registro ABC neuroafirmativo, bitácora fisiológica y evolución descriptiva.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {children.length > 0 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white text-slate-800 focus:ring-2 focus:ring-sky-500"
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    Niño: {c.name} {c.nickname ? `(${c.nickname})` : ''}
                  </option>
                ))}
              </select>
            )}

            <Link href={`/calendar?childId=${selectedChildId}`}>
              <Button
                variant="secondary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
              >
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>Ver en Calendario</span>
              </Button>
            </Link>

            {/* Botón de acción contextual según la pestaña */}
            {activeTab === 'timeline' && (
              <Button
                onClick={() => setShowObsModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Observación</span>
              </Button>
            )}

            {activeTab === 'abc' && (
              <Button
                onClick={() => setShowABCModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Registro ABC</span>
              </Button>
            )}

            {activeTab === 'somatic' && (
              <Button
                onClick={() => setShowSomaticModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Día / Sueño</span>
              </Button>
            )}

            {activeTab === 'goals' && (
              <Button
                onClick={() => setShowGoalModal(true)}
                variant="primary"
                size="md"
                className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Objetivo</span>
              </Button>
            )}
          </div>
        </div>

        {/* WIDGET DE INTEGRACIÓN: Sesiones y Eventos de Calendario en Seguimiento */}
        {scheduleEvents.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50/70 via-purple-50/50 to-sky-50/70 rounded-3xl p-5 border border-rose-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    Sesiones y Anticipación Programada (Calendario)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronizadas directamente con la agenda y el calendario de anticipación
                  </p>
                </div>
              </div>

              <Link
                href={`/calendar?childId=${selectedChildId}`}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
              >
                <span>Abrir Calendario y Patrones</span>
                <span className="text-sm">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scheduleEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev._id}
                  className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{ev.iconEmoji || '🌸'}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                        {ev.badgeLabel || 'Sesión'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{ev.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      📅 {ev.date} {ev.startTime ? `• ⏰ ${ev.startTime}` : ''}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setObsDescription(`Evolución en sesión: ${ev.title}. `);
                        setObsDate(ev.date);
                        setObsEventId(ev._id);
                        setShowObsModal(true);
                      }}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900"
                    >
                      📝 Registrar evolución
                    </button>
                    <Link
                      href={`/calendar?childId=${selectedChildId}`}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Ver fecha
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pestañas de Navegación de Seguimiento y Evolución */}
        <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-sky-600 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Línea Temporal de Registros ({timelineItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('abc')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'abc'
                ? 'border-purple-600 text-purple-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Registro ABC Contextual ({abcLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('somatic')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'somatic'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Bitácora Somática y Sueño ({somaticLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'goals'
                ? 'border-sky-600 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Objetivos PEI / IEP ({goals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Evolución y Reportes Descriptivos</span>
          </button>
        </div>

        {/* PESTAÑA 1: LÍNEA TEMPORAL DE REGISTROS (UNIFICADA) */}
        {activeTab === 'timeline' && (
          <section className="space-y-6">
            {/* Filtros de la línea temporal */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              {(['all', 'obs', 'abc', 'events', 'somatic', 'battery'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTimelineFilter(f)}
                  className={`px-3 py-1.5 rounded-full border transition-all ${
                    timelineFilter === f
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f === 'all' && 'Todos los eventos'}
                  {f === 'obs' && 'Observaciones'}
                  {f === 'abc' && 'Registros ABC'}
                  {f === 'events' && '📅 Agenda / Calendario'}
                  {f === 'somatic' && 'Somático / Sueño'}
                  {f === 'battery' && 'Termómetro Sensorial'}
                </button>
              ))}
            </div>

            {timelineItems.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-base">No hay registros en la línea temporal</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Registra observaciones, entradas ABC o bitácoras somáticas para ver la evolución cronológica.
                </p>
                <Button onClick={() => setShowObsModal(true)} variant="primary" size="sm">
                  Agregar Primera Entrada
                </Button>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
                {timelineItems.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Punto indicador de la línea de tiempo */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-white border-4 border-sky-500 shadow-xs group-hover:scale-125 transition-transform" />

                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${item.badge.bg} ${item.badge.text}`}
                          >
                            {item.badge.label}
                          </span>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">{item.title}</h4>
                        </div>
                        <span className="text-xs text-slate-400 font-bold">
                          {item.date.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {item.content}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Registrado por: {item.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 2: REGISTRO ABC NEUROAFIRMATIVO */}
        {activeTab === 'abc' && (
          <section className="space-y-6">
            <div className="p-5 rounded-3xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-purple-950 text-lg">
                  Registro ABC Contextual y Neuroafirmativo
                </h3>
                <p className="text-xs text-purple-900 mt-1 max-w-2xl font-medium">
                  Este registro no etiqueta conductas como «problemáticas». Se enfoca en identificar barreras sensoriales o del entorno (A), comprender la necesidad comunicativa subyacente (B) y registrar los apoyos eficaces que restablecieron el bienestar (C).
                </p>
              </div>

              <Button
                onClick={() => setShowABCModal(true)}
                variant="primary"
                size="md"
                className="font-bold bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Registro ABC</span>
              </Button>
            </div>

            {abcLogs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <Shield className="w-10 h-10 text-purple-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">No hay registros ABC aún</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Registra un episodio para analizar factores ambientales y apoyos que funcionaron.
                </p>
                <Button onClick={() => setShowABCModal(true)} variant="primary" size="sm">
                  Crear Registro ABC
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {abcLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600" />
                        <h4 className="font-black text-slate-800 text-sm">
                          Episodio del {new Date(log.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 font-bold">
                        Por: {log.author?.name || 'Profesional/Tutor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* A */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider block">
                          A • Antecedente / Entorno
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {log.antecedentContext}
                        </p>
                      </div>

                      {/* B */}
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                        <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">
                          B • Expresión o Conducta
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {log.observedBehavior}
                        </p>
                        {log.unmetNeed && (
                          <div className="mt-2 text-[11px] font-bold text-amber-900 bg-amber-100 p-1.5 rounded-lg">
                            🔍 Necesidad: {log.unmetNeed}
                          </div>
                        )}
                      </div>

                      {/* C */}
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                          C • Apoyo Brindado y Resultado
                        </span>
                        <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                          <strong>Apoyo:</strong> {log.supportProvided}
                        </p>
                        <p className="text-xs text-emerald-900 font-bold mt-1">
                          <strong>Resultado:</strong> {log.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 3: BITÁCORA FISIOLÓGICA Y SOMÁTICA */}
        {activeTab === 'somatic' && (
          <section className="space-y-6">
            <div className="p-5 rounded-3xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-teal-950 text-lg">
                  Bitácora Fisiológica y Somática
                </h3>
                <p className="text-xs text-teal-900 mt-1 max-w-2xl font-medium">
                  Monitoreo no invasivo de descanso, sueño, molestias físicas y apetito. Permite entender el estado basal del niño sin hacer diagnósticos automáticos ni juicios apresurados.
                </p>
              </div>

              <Button
                onClick={() => setShowSomaticModal(true)}
                variant="primary"
                size="md"
                className="font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Entrada Somática</span>
              </Button>
            </div>

            {somaticLogs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <Moon className="w-10 h-10 text-teal-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">No hay registros somáticos aún</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Registra cómo durmió el niño anoche y su confort físico general.
                </p>
                <Button onClick={() => setShowSomaticModal(true)} variant="primary" size="sm">
                  Registrar Primer Día
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {somaticLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800">
                          {new Date(log.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                          Calidad: {log.sleepQuality}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold">Horas de sueño:</span>
                          <span className="font-black text-slate-800">{log.sleepHours ?? 'N/A'} hrs</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold">Apetito:</span>
                          <span className="font-black text-slate-800 capitalize">{log.appetite}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold">Molestia o dolor:</span>
                          <span className="font-black text-slate-800 capitalize">{log.physicalDiscomfort}</span>
                        </div>
                        {log.discomfortNotes && (
                          <p className="p-2 rounded-xl bg-rose-50 text-rose-900 text-[11px] font-medium">
                            ⚠️ {log.discomfortNotes}
                          </p>
                        )}
                        {log.wellbeingNote && (
                          <p className="text-slate-600 italic mt-1 font-medium">{log.wellbeingNote}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                      Por: {log.author?.name || 'Familia'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 4: OBJETIVOS PEI/IEP */}
        {activeTab === 'goals' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200">
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  Objetivos Individualizados (PEI / IEP)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Metas acordadas colaborativamente entre terapeutas, docentes y familia.
                </p>
              </div>

              <Button onClick={() => setShowGoalModal(true)} variant="primary" size="md">
                <Plus className="w-4 h-4 mr-1" />
                <span>Nuevo Objetivo</span>
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">No hay objetivos configurados</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Define metas funcionales de autonomía, comunicación o autorregulación.
                </p>
                <Button onClick={() => setShowGoalModal(true)} variant="primary" size="sm">
                  Crear Primer Objetivo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => (
                  <div
                    key={g._id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-black text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                          {areaLabels[g.area] || g.area}
                        </span>

                        <select
                          value={g.status}
                          onChange={(e) => handleUpdateGoalStatus(g._id, e.target.value as GoalStatus)}
                          className="text-xs font-black px-2.5 py-1 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="propuesto">Propuesto</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="alcanzado">Alcanzado 🎉</option>
                          <option value="pausado">Pausado</option>
                        </select>
                      </div>

                      <h4 className="font-black text-slate-900 text-base mt-2">{g.description}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>Criterio de logro:</strong> {g.criteria}
                      </p>

                      {/* Notas de avance */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Notas de avance ({g.progressNotes?.length || 0}):
                        </span>
                        {g.progressNotes && g.progressNotes.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {g.progressNotes.map((pn, i) => (
                              <div key={i} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-slate-700 font-medium">{pn.note}</p>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  {new Date(pn.date).toLocaleDateString()} • {pn.authorName || 'Equipo'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Sin notas de progreso aún.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {selectedGoalForNote === g._id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={progressNoteText}
                            onChange={(e) => setProgressNoteText(e.target.value)}
                            placeholder="Escribe el avance observado..."
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedGoalForNote(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddProgressNote(g._id)}
                            >
                              Guardar Nota
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedGoalForNote(g._id)}
                          className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar nota de avance</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 5: EVOLUCIÓN Y REPORTES DESCRIPTIVOS (SIN CAUSALIDAD FALSA) */}
        {activeTab === 'reports' && (
          <section className="space-y-6">
            {/* Aviso ético y clínico explícito */}
            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
              <Info className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-amber-950">
                  Compromiso Ético: Gráficos puramente descriptivos
                </h4>
                <p className="text-xs text-amber-900/90 mt-1 font-medium leading-relaxed">
                  <strong>Una correlación no demuestra causalidad.</strong> Si el sistema muestra menos horas de sueño en días con desafíos en la escuela, esto no implica que uno cause automáticamente al otro. Estos gráficos ofrecen tendencias de apoyo para el diálogo clínico y educativo, evitando diagnósticos automatizados.
                </p>
              </div>
            </div>

            {/* Tarjetas de Métricas Descriptivas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Promedio de Sueño
                </span>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  {summary?.somatic?.avgSleepHours ? `${summary.somatic.avgSleepHours} hrs` : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  En los últimos {summary?.somatic?.totalLogs || 0} registros
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Estados Sensoriales
                </span>
                <p className="text-3xl font-black text-emerald-600 mt-2">
                  {summary?.sensoryBattery?.distribution?.comodo || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Reportes en estado "Cómodo y tranquilo"
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Sobrecargas Detectadas
                </span>
                <p className="text-3xl font-black text-rose-500 mt-2">
                  {summary?.sensoryBattery?.distribution?.sobrecarga || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Momentos atendidos con apoyo
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Registros ABC
                </span>
                <p className="text-3xl font-black text-purple-600 mt-2">
                  {summary?.abc?.totalLogs || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Análisis contextuales completados
                </p>
              </div>
            </div>

            {/* Desglose visual de Calidad de Sueño y Estados de Batería */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desglose de sueño */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-black text-slate-800 text-base">
                  Distribución de Calidad de Sueño Registrada
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'muy_bueno', label: 'Muy bueno / Reparador', color: 'bg-emerald-500' },
                    { key: 'bueno', label: 'Bueno', color: 'bg-teal-500' },
                    { key: 'regular', label: 'Regular', color: 'bg-amber-500' },
                    { key: 'inquieto', label: 'Inquieto / Despertares', color: 'bg-rose-500' },
                  ].map((item) => {
                    const count = summary?.somatic?.sleepQualityCounts?.[item.key] || 0;
                    const total = summary?.somatic?.totalLogs || 1;
                    const pct = Math.round((count / (total || 1)) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{count} días ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desglose de estados sensoriales */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-black text-slate-800 text-base">
                  Frecuencia de Estados en el Termómetro Sensorial
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'comodo', label: '😊 Cómodo y tranquilo', color: 'bg-emerald-500' },
                    { key: 'cansado', label: '🥱 Un poco cansado', color: 'bg-amber-500' },
                    { key: 'pausa', label: '☕ Necesita una pausa', color: 'bg-sky-500' },
                    { key: 'sobrecarga', label: '⚡ Demasiados estímulos', color: 'bg-rose-500' },
                  ].map((item) => {
                    const count = summary?.sensoryBattery?.distribution?.[item.key] || 0;
                    const total = summary?.sensoryBattery?.totalEntries || 1;
                    const pct = Math.round((count / (total || 1)) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{count} veces ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL: Nueva Observación */}
      {showObsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Nueva Observación</h2>
            <p className="text-xs text-slate-500 mb-6">
              Registra hechos descriptivos observados y los apoyos que resultaron útiles.
            </p>

            <form onSubmit={handleCreateObservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value as ObservationCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="bienestar">🌿 Bienestar general</option>
                  <option value="sensorial">💡 Sensorial</option>
                  <option value="descanso">☕ Descanso / Sueño</option>
                  <option value="conductual">🧩 Autorregulación</option>
                  <option value="social">👥 Interacción social</option>
                  <option value="pedagogico">📚 Pedagógico / Aprendizaje</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de Observación
                  </label>
                  <input
                    type="date"
                    value={obsDate}
                    onChange={(e) => setObsDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                {scheduleEvents.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Vincular a Sesión (Calendario)
                    </label>
                    <select
                      value={obsEventId}
                      onChange={(e) => setObsEventId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="">(Sin sesión específica)</option>
                      {scheduleEvents.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.iconEmoji || '🌸'} {ev.date} - {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descripción Descriptiva
                </label>
                <textarea
                  required
                  rows={3}
                  value={obsDescription}
                  onChange={(e) => setObsDescription(e.target.value)}
                  placeholder="Describe la situación observada de forma objetiva..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Apoyos Utilizados (separados por comas)
                </label>
                <input
                  type="text"
                  value={obsSupports}
                  onChange={(e) => setObsSupports(e.target.value)}
                  placeholder="Ej. Temporizador visual, Zona de calma, SAAC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resultado o Resolución Observada
                </label>
                <input
                  type="text"
                  value={obsOutcome}
                  onChange={(e) => setObsOutcome(e.target.value)}
                  placeholder="Ej. Recuperó la calma en 5 minutos y continuó el dibujo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowObsModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Guardar Observación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Registro ABC Neuroafirmativo */}
      {showABCModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Nuevo Registro ABC Contextual</h2>
            <p className="text-xs text-slate-500 mb-6">
              Analiza los factores del entorno y la necesidad comunicativa subyacente.
            </p>

            <form onSubmit={handleCreateABCLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  A • Antecedente y Entorno Ambiental
                </label>
                <textarea
                  required
                  rows={2}
                  value={abcAntecedent}
                  onChange={(e) => setAbcAntecedent(e.target.value)}
                  placeholder="¿Qué ocurría antes? (ruido, cambio de actividad, luz intensa, cansancio...)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  B • Conducta Observable / Expresión Comunicativa
                </label>
                <textarea
                  required
                  rows={2}
                  value={abcBehavior}
                  onChange={(e) => setAbcBehavior(e.target.value)}
                  placeholder="¿Cómo se manifestó? (taparse oídos, llanto, agitar manos, alejarse...)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Necesidad no atendida o Barrera identificada (Opcional)
                </label>
                <input
                  type="text"
                  value={abcUnmetNeed}
                  onChange={(e) => setAbcUnmetNeed(e.target.value)}
                  placeholder="Ej. Sobrecarga acústica, sed, falta de anticipación..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  C • Apoyo Brindado (Ajuste o Estrategia Aplicada)
                </label>
                <input
                  type="text"
                  required
                  value={abcSupport}
                  onChange={(e) => setAbcSupport(e.target.value)}
                  placeholder="Ej. Ofrecer audífonos, acompañar a zona de calma, pictogramas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resultado o Desenlace
                </label>
                <input
                  type="text"
                  value={abcOutcome}
                  onChange={(e) => setAbcOutcome(e.target.value)}
                  placeholder="Ej. Respiró hondo, bebió agua y volvió a participar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowABCModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold bg-purple-600 hover:bg-purple-700">
                  Guardar Registro ABC
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Bitácora Somática */}
      {showSomaticModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Bitácora Somática y de Sueño</h2>
            <p className="text-xs text-slate-500 mb-6">
              Registra horas de descanso y confort físico de la jornada.
            </p>

            <form onSubmit={handleCreateSomaticLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Horas de Sueño
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={somaticSleepHours}
                    onChange={(e) => setSomaticSleepHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Calidad del Sueño
                  </label>
                  <select
                    value={somaticSleepQuality}
                    onChange={(e) => setSomaticSleepQuality(e.target.value as SleepQuality)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="muy_bueno">Muy bueno / Reparador</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="inquieto">Inquieto / Despertares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Apetito / Alimentación
                  </label>
                  <select
                    value={somaticAppetite}
                    onChange={(e) => setSomaticAppetite(e.target.value as AppetiteLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="bajo">Bajo / Poco apetito</option>
                    <option value="selectivo">Selectivo hoy</option>
                    <option value="aumentado">Aumentado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Molestia Física / Dolor
                  </label>
                  <select
                    value={somaticDiscomfort}
                    onChange={(e) => setSomaticDiscomfort(e.target.value as DiscomfortLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="leve">Leve</option>
                    <option value="moderado">Moderado</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas sobre molestias físicas (Opcional)
                </label>
                <input
                  type="text"
                  value={somaticDiscomfortNotes}
                  onChange={(e) => setSomaticDiscomfortNotes(e.target.value)}
                  placeholder="Ej. Dolor de estómago matutino, dentición..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nota general de bienestar
                </label>
                <input
                  type="text"
                  value={somaticWellbeingNote}
                  onChange={(e) => setSomaticWellbeingNote(e.target.value)}
                  placeholder="Ej. Despertó sonriente y con buena energía"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowSomaticModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold bg-teal-600 hover:bg-teal-700">
                  Guardar Bitácora
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Objetivo */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Nuevo Objetivo PEI / IEP</h2>
            <p className="text-xs text-slate-500 mb-6">
              Establece una meta funcional y medible para el plan individualizado.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Área</label>
                <select
                  value={goalArea}
                  onChange={(e) => setGoalArea(e.target.value as GoalArea)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="comunicacion">🗣️ Comunicación</option>
                  <option value="autonomia">🌟 Autonomía</option>
                  <option value="sensorial">🌿 Regulación Sensorial</option>
                  <option value="social">👥 Social</option>
                  <option value="cognitiva">🧠 Cognitiva</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descripción del Objetivo
                </label>
                <textarea
                  required
                  rows={3}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder="Ej. Solicitar una pausa utilizando el pictograma en el comunicador..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Criterio de Logro
                </label>
                <input
                  type="text"
                  required
                  value={goalCriteria}
                  onChange={(e) => setGoalCriteria(e.target.value)}
                  placeholder="Ej. En 4 de 5 oportunidades con apoyo visual mínimo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowGoalModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Crear Objetivo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando seguimiento...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
