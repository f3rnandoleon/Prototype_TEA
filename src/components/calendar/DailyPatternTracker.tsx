'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Moon,
  Battery,
  AlertTriangle,
  Heart,
  Volume2,
  Sun,
  Shirt,
  Utensils,
  Shuffle,
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  Lightbulb,
  FileText,
  Plus,
  ArrowRight,
  User,
  Zap,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { ISomaticLog, IScheduleEvent, IObservation, IABCLog } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface FactorOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  category: 'somatic' | 'sensory' | 'routine';
}

interface DailyPatternTrackerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  somaticLog?: ISomaticLog | null;
  dayEvents?: IScheduleEvent[];
  dayObservations?: IObservation[];
  dayAbcLogs?: IABCLog[];
  childId?: string;
  onRefreshData?: () => void;
  onSaveDay: (data: {
    symptoms: string[];
    mood: string;
    wellbeingNote?: string;
  }) => Promise<void>;
  patternInsights?: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
    severity?: string;
  }>;
}

export const DailyPatternTracker: React.FC<DailyPatternTrackerProps> = ({
  selectedDate,
  onSelectDate,
  somaticLog,
  dayEvents = [],
  dayObservations = [],
  dayAbcLogs = [],
  childId,
  onRefreshData,
  onSaveDay,
  patternInsights = [],
}) => {
  // Lista de síntomas y factores adaptados al contexto TEA basados en la imagen 2
  const factorsList: FactorOption[] = [
    {
      id: 'molestia_estomago',
      label: 'Molestia abdominal o somática',
      icon: <Activity className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-100/70',
      category: 'somatic',
    },
    {
      id: 'sensibilidad_ruido',
      label: 'Sensibilidad al ruido / Bullicio',
      icon: <Volume2 className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-100/70',
      category: 'sensory',
    },
    {
      id: 'sensibilidad_luces',
      label: 'Sensibilidad visual / Luces intensas',
      icon: <Sun className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100/70',
      category: 'sensory',
    },
    {
      id: 'texturas_ropa',
      label: 'Molestia táctil (Costuras / Texturas)',
      icon: <Shirt className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-100/70',
      category: 'sensory',
    },
    {
      id: 'insomnio',
      label: 'Dificultad de sueño / Insomnio',
      icon: <Moon className="w-5 h-5 text-sky-600" />,
      iconBg: 'bg-sky-100/70',
      category: 'somatic',
    },
    {
      id: 'selectividad_comida',
      label: 'Selectividad o rechazo de comida',
      icon: <Utensils className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-100/70',
      category: 'somatic',
    },
    {
      id: 'cambio_rutina',
      label: 'Desregulación por cambio de rutina',
      icon: <Shuffle className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100/70',
      category: 'routine',
    },
    {
      id: 'bateria_baja',
      label: 'Sobrecarga / Batería sensorial baja',
      icon: <Battery className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-100/70',
      category: 'sensory',
    },
    {
      id: 'stimming_intenso',
      label: 'Búsqueda propioceptiva / Stimming alto',
      icon: <Sparkles className="w-5 h-5 text-teal-600" />,
      iconBg: 'bg-teal-100/70',
      category: 'sensory',
    },
  ];

  // Estados de ánimo con emojis y expresiones (idéntico a la sección de la imagen 2)
  const moodList = [
    { id: 'ansioso', emoji: '😟', label: 'Sobrecargado / Ansioso', bg: 'bg-sky-50' },
    { id: 'radiante', emoji: '🤩', label: 'Radiante / Motivado', bg: 'bg-amber-50' },
    { id: 'carinoso', emoji: '🥰', label: 'Conectado / Cariñoso', bg: 'bg-rose-50' },
    { id: 'alerta', emoji: '😮', label: 'Asombrado / Alerta', bg: 'bg-amber-50' },
    { id: 'jugueton', emoji: '🤪', label: 'Juguetón / Activo', bg: 'bg-yellow-50' },
    { id: 'tranquilo', emoji: '😊', label: 'Tranquilo / Regulado', bg: 'bg-emerald-50' },
    { id: 'cansado', emoji: '😴', label: 'Cansado / Con sueño', bg: 'bg-slate-100' },
    { id: 'triste', emoji: '😢', label: 'Triste / Frustrado', bg: 'bg-blue-50' },
  ];

  // Estado local para los síntomas y estado de ánimo del día seleccionado
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('tranquilo');
  const [wellbeingNote, setWellbeingNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Formulario rápido de nota / observación de evolución
  const [showQuickObsForm, setShowQuickObsForm] = useState(false);
  const [obsCategory, setObsCategory] = useState<'bienestar' | 'sensorial' | 'descanso' | 'conductual' | 'social' | 'pedagogico'>('bienestar');
  const [obsDescription, setObsDescription] = useState('');
  const [obsSupports, setObsSupports] = useState('');
  const [obsOutcome, setObsOutcome] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);

  const handleQuickObsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || !obsDescription.trim()) return;
    setIsSubmittingObs(true);
    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          date: selectedDate.toISOString(),
          category: obsCategory,
          description: obsDescription,
          supportsUsed: obsSupports.split(',').map((s) => s.trim()).filter(Boolean),
          observedOutcome: obsOutcome,
          scheduleEventId: selectedEventId || undefined,
        }),
      });
      if (res.ok) {
        setShowQuickObsForm(false);
        setObsDescription('');
        setObsSupports('');
        setObsOutcome('');
        setSelectedEventId('');
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error al guardar observación rápida:', err);
    } finally {
      setIsSubmittingObs(false);
    }
  };

  // Cargar datos cuando cambia la fecha o el log somático
  useEffect(() => {
    if (somaticLog) {
      setSelectedSymptoms(somaticLog.symptoms || []);
      setSelectedMood(somaticLog.mood || 'tranquilo');
      setWellbeingNote(somaticLog.wellbeingNote || '');
    } else {
      setSelectedSymptoms([]);
      setSelectedMood('tranquilo');
      setWellbeingNote('');
    }
  }, [somaticLog, selectedDate]);

  // Construir la semana alrededor de la fecha seleccionada (7 días: LUN a DOM)
  const weekDays = React.useMemo(() => {
    const current = new Date(selectedDate);
    // Obtener el lunes de la semana actual
    let day = current.getDay();
    let diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const days = [];
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        number: d.getDate(),
        date: d,
        dateStr: d.toISOString().split('T')[0],
      });
    }
    return days;
  }, [selectedDate]);

  // Manejar toggle de factor
  const handleToggleFactor = async (factorId: string) => {
    const newSymptoms = selectedSymptoms.includes(factorId)
      ? selectedSymptoms.filter((id) => id !== factorId)
      : [...selectedSymptoms, factorId];

    setSelectedSymptoms(newSymptoms);
    await triggerAutoSave(newSymptoms, selectedMood, wellbeingNote);
  };

  // Manejar cambio de estado de ánimo
  const handleSelectMood = async (moodId: string) => {
    setSelectedMood(moodId);
    await triggerAutoSave(selectedSymptoms, moodId, wellbeingNote);
  };

  // Guardado automático y suave
  const triggerAutoSave = async (symptoms: string[], mood: string, note: string) => {
    setIsSaving(true);
    try {
      await onSaveDay({
        symptoms,
        mood,
        wellbeingNote: note,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Título idéntico a la imagen de referencia: "Registra síntomas, detecta patrones" */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#701a3c] tracking-tight leading-tight">
          Registra síntomas,
          <br />
          detecta patrones
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Identifica factores ambientales, malestares físicos y autorregulación día a día.
        </p>
      </div>

      {/* Selector semanal idéntico a la imagen 2:
          Fila LUN, MAR, MIÉ, JUE, VIE, SÁB, DOM con círculo sólido en el día activo */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        {weekDays.map((wDay) => {
          const isSelected = isSameDay(wDay.date, selectedDate);
          return (
            <button
              key={wDay.dateStr}
              onClick={() => onSelectDate(wDay.date)}
              className="flex flex-col items-center justify-center space-y-1 focus:outline-none transition-all group min-w-[36px] sm:min-w-[44px]"
            >
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-wider">
                {wDay.name}
              </span>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base font-black transition-all ${
                  isSelected
                    ? 'bg-[#9f1239] text-white shadow-md shadow-rose-900/20 scale-105 ring-2 ring-rose-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {wDay.number}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista de tarjetas de factores y síntomas con casilla de verificación */}
      <div className="space-y-2.5 sm:space-y-3">
        {factorsList.map((factor) => {
          const isChecked = selectedSymptoms.includes(factor.id);

          return (
            <div
              key={factor.id}
              onClick={() => handleToggleFactor(factor.id)}
              className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl transition-all flex items-center justify-between cursor-pointer border select-none active:scale-[0.98] ${
                isChecked
                  ? 'bg-white shadow-md shadow-rose-900/5 border-rose-200 -translate-y-0.5'
                  : 'bg-white/90 hover:bg-white shadow-sm border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Ícono dentro de un círculo suave */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform shrink-0 ${
                    factor.iconBg
                  } ${isChecked ? 'scale-105' : ''}`}
                >
                  {factor.icon}
                </div>

                <span className="text-xs sm:text-base font-bold text-slate-800 leading-snug">
                  {factor.label}
                </span>
              </div>

              {/* Círculo de selección interactivo:
                  Lleno con check si está activo, aro suave si está inactivo (como en imagen 2) */}
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all shrink-0 ml-2 ${
                  isChecked
                    ? 'bg-[#9f1239] text-white shadow-sm'
                    : 'border-2 border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                {isChecked && <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección: Estados de ánimo (idéntico a la cuadrícula de emojis de la imagen 2) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            Estados de ánimo
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold truncate max-w-[160px]">
            {moodList.find((m) => m.id === selectedMood)?.label}
          </span>
        </div>

        {/* Cuadrícula de caritas con insignias de checkmark */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 justify-items-center">
          {moodList.map((mood) => {
            const isSelected = selectedMood === mood.id;

            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood.id)}
                className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-4xl transition-all focus:outline-none select-none active:scale-95 ${
                  mood.bg
                } ${
                  isSelected
                    ? 'scale-105 sm:scale-110 shadow-md ring-2 ring-amber-400/80 ring-offset-2'
                    : 'hover:scale-105 hover:bg-amber-50/50'
                }`}
                title={mood.label}
              >
                <span>{mood.emoji}</span>

                {/* Insignia pequeña de check en la esquina inferior derecha como en la imagen 2 */}
                {isSelected && (
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm border-2 border-white">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Observaciones del día */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-2">
        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
          Nota u observación del día
        </label>
        <textarea
          rows={2}
          value={wellbeingNote}
          onChange={(e) => setWellbeingNote(e.target.value)}
          onBlur={() => triggerAutoSave(selectedSymptoms, selectedMood, wellbeingNote)}
          placeholder="Escribe detalles del estado basal, apoyos que sirvieron o eventos especiales..."
          className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
      </div>

      {/* Indicador de estado de guardado */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-400 font-bold">
        <span>
          {isSaving ? 'Guardando en la nube...' : saveSuccess ? '✓ Guardado exitosamente' : 'Sincronizado'}
        </span>
        <span className="text-slate-500">
          Fecha: {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* SECCIÓN INTEGRADA: Seguimiento y Evolución del Día (Reflejado en Calendario) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Evolución y Registros del Día
              </h3>
              <p className="text-[11px] text-slate-400">
                Observaciones clínicas, notas pedagógicas y registros ABC sincronizados
              </p>
            </div>
          </div>

          {!showQuickObsForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickObsForm(true)}
              className="text-xs font-bold gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nota</span>
            </Button>
          )}
        </div>

        {/* Formulario rápido para añadir observación sin salir del calendario */}
        {showQuickObsForm && (
          <form onSubmit={handleQuickObsSubmit} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 uppercase">
                Nueva Nota de Evolución para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
              <button
                type="button"
                onClick={() => setShowQuickObsForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-purple-200 bg-white"
                >
                  <option value="bienestar">Bienestar / Estado basal</option>
                  <option value="sensorial">Sensorial y Autorregulación</option>
                  <option value="conductual">Conductual / Apoyo positivo</option>
                  <option value="social">Social y Comunicación</option>
                  <option value="pedagogico">Pedagógico y Aprendizaje</option>
                  <option value="descanso">Descanso y Sueño</option>
                </select>
              </div>

              {dayEvents.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Vincular a Sesión</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-purple-200 bg-white"
                  >
                    <option value="">(Ninguna sesión específica)</option>
                    {dayEvents.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.iconEmoji} {ev.title} {ev.startTime ? `(${ev.startTime})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción / Evolución</label>
              <textarea
                rows={2}
                required
                value={obsDescription}
                onChange={(e) => setObsDescription(e.target.value)}
                placeholder="Describe el avance, desempeño o respuesta durante la sesión o el día..."
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Apoyos que sirvieron (separados por coma)</label>
                <input
                  type="text"
                  value={obsSupports}
                  onChange={(e) => setObsSupports(e.target.value)}
                  placeholder="Ej. audífonos, temporizador, apoyo visual"
                  className="w-full text-xs p-2 rounded-xl border border-purple-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Resultado observado</label>
                <input
                  type="text"
                  value={obsOutcome}
                  onChange={(e) => setObsOutcome(e.target.value)}
                  placeholder="Ej. Logró mantener la atención 20 min"
                  className="w-full text-xs p-2 rounded-xl border border-purple-200 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowQuickObsForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmittingObs} className="bg-purple-600 hover:bg-purple-700 font-bold">
                {isSubmittingObs ? 'Guardando...' : 'Guardar Observación'}
              </Button>
            </div>
          </form>
        )}

        {/* 1. Sesiones del Calendario para este día */}
        {dayEvents.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Sesiones y Eventos de la Agenda ({dayEvents.length})
            </span>
            <div className="space-y-1.5">
              {dayEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">{ev.iconEmoji || '📅'}</span>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{ev.title}</span>
                        {ev.startTime && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded-md">
                            {ev.startTime}
                          </span>
                        )}
                      </div>
                      {ev.visualPrepNotes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{ev.visualPrepNotes}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEventId(ev._id);
                      setObsDescription(`Evolución en sesión: ${ev.title}. `);
                      setShowQuickObsForm(true);
                    }}
                    className="text-[11px] font-bold text-sky-700 hover:bg-sky-100 shrink-0"
                  >
                    📝 Nota
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Observaciones registradas para este día */}
        {dayObservations.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Observaciones Registradas ({dayObservations.length})
            </span>
            <div className="space-y-2">
              {dayObservations.map((obs) => (
                <div
                  key={obs._id}
                  className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-purple-900 capitalize bg-purple-100 px-2 py-0.5 rounded-lg text-[10px]">
                        {obs.category}
                      </span>
                      {obs.author && (
                        <span className="text-[10px] font-bold text-slate-500">
                          por {obs.author.name} ({obs.author.role === 'professional' ? (obs.author.specialty || 'Profesional') : obs.author.role})
                        </span>
                      )}
                    </div>
                    {obs.scheduleEventId && (
                      <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded">
                        🗓️ Sesión vinculada
                      </span>
                    )}
                  </div>

                  <p className="text-slate-800 font-medium leading-relaxed">
                    {obs.description}
                  </p>

                  {obs.supportsUsed && obs.supportsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {obs.supportsUsed.map((s, i) => (
                        <span key={i} className="text-[10px] bg-white text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-semibold">
                          🌿 {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {obs.observedOutcome && (
                    <p className="text-[11px] text-emerald-700 font-semibold pt-0.5">
                      ✓ Resultado: {obs.observedOutcome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Registros ABC del día */}
        {dayAbcLogs.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider">
              Registros ABC / Apoyo Brindado ({dayAbcLogs.length})
            </span>
            <div className="space-y-2">
              {dayAbcLogs.map((abc) => (
                <div
                  key={abc._id}
                  className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between text-amber-900 font-black">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Contexto y Apoyo</span>
                    </span>
                    {abc.author && (
                      <span className="text-[10px] font-normal text-slate-500">
                        {abc.author.name}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">
                    <span className="font-bold text-slate-900">Antecedente:</span> {abc.antecedentContext}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-bold text-slate-900">Conducta:</span> {abc.observedBehavior}
                  </p>
                  <p className="text-emerald-800 font-medium">
                    <span className="font-bold">Apoyo:</span> {abc.supportProvided}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayEvents.length === 0 && dayObservations.length === 0 && dayAbcLogs.length === 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Sin sesiones ni observaciones clínicas registradas para esta fecha.
          </div>
        )}

        {/* Enlace directo hacia el módulo de seguimiento */}
        {childId && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">¿Quieres ver la evolución global?</span>
            <Link
              href={`/tracking?childId=${childId}`}
              className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              <span>Ir a Módulo de Seguimiento</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Tarjeta de Patrones Detectados */}
      {patternInsights.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-rose-50 border border-purple-200/70 space-y-3">
          <div className="flex items-center space-x-2 text-purple-900 font-black text-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Patrones Inteligentes Detectados</span>
          </div>

          <div className="space-y-2.5">
            {patternInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/80 border border-purple-100 text-xs text-slate-700 space-y-1 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-purple-950">
                  <span>{insight.icon}</span>
                  <span>{insight.title}</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
