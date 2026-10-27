'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Smile,
  Shield,
  Layers,
  Heart,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IScheduleEvent, ISomaticLog, IObservation, IABCLog } from '@/types';

interface DayEvolutionRecordsProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  childId?: string;
  childName?: string;
  dayEvents?: IScheduleEvent[];
  dayObservations?: IObservation[];
  dayAbcLogs?: IABCLog[];
  somaticLog?: ISomaticLog | null;
  onRefreshData?: () => void;
  onOpenNewEventModal?: (defaultDateStr?: string) => void;
  onOpenSensoryTracker?: () => void;
}

export const DayEvolutionRecords: React.FC<DayEvolutionRecordsProps> = ({
  selectedDate,
  onSelectDate,
  childId,
  childName = 'Estudiante',
  dayEvents = [],
  dayObservations = [],
  dayAbcLogs = [],
  somaticLog,
  onRefreshData,
  onOpenNewEventModal,
  onOpenSensoryTracker,
}) => {
  // Formulario rápido para añadir observación de evolución
  const [showQuickObsForm, setShowQuickObsForm] = useState(false);
  const [obsCategory, setObsCategory] = useState<
    'bienestar' | 'sensorial' | 'descanso' | 'conductual' | 'social' | 'pedagogico'
  >('bienestar');
  const [obsDescription, setObsDescription] = useState('');
  const [obsSupports, setObsSupports] = useState('');
  const [obsOutcome, setObsOutcome] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Formato legible de fecha en español
  const formattedDate = React.useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const str = selectedDate.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate]);

  // Verificar si la fecha seleccionada es hoy
  const isToday = React.useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // Navegación rápida de días
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const handleGoToday = () => {
    onSelectDate(new Date());
  };

  // Enviar observación rápida
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
          supportsUsed: obsSupports
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
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
        setFormSuccessMessage('¡Observación de evolución registrada con éxito!');
        setTimeout(() => setFormSuccessMessage(null), 3000);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error al guardar observación rápida:', err);
    } finally {
      setIsSubmittingObs(false);
    }
  };

  // Etiquetas amigables para categorías de observación
  const categoryLabels: Record<string, { label: string; bg: string; text: string }> = {
    bienestar: { label: 'Bienestar / Basal', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    sensorial: { label: 'Sensorial / Regulación', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    conductual: { label: 'Conductual / Apoyo', bg: 'bg-amber-100', text: 'text-amber-800' },
    social: { label: 'Social / Comunicación', bg: 'bg-sky-100', text: 'text-sky-800' },
    pedagogico: { label: 'Pedagógico / Aprendizaje', bg: 'bg-purple-100', text: 'text-purple-800' },
    descanso: { label: 'Descanso / Sueño', bg: 'bg-slate-100', text: 'text-slate-800' },
  };

  // Etiquetas para factores/síntomas somáticos
  const symptomLabels: Record<string, string> = {
    sensibilidad_ruido: 'Sensibilidad auditiva',
    sensibilidad_luces: 'Sensibilidad visual',
    texturas_ropa: 'Sensibilidad táctil',
    molestia_estomago: 'Molestia estomacal',
    insomnio: 'Descanso insuficiente',
    selectividad_comida: 'Selectividad alimentaria',
    cambio_rutina: 'Cambio de rutina',
    bateria_baja: 'Batería social baja',
    stimming_intenso: 'Búsqueda propioceptiva',
  };

  const totalEntries = dayEvents.length + dayObservations.length + dayAbcLogs.length;

  return (
    <div
      id="day-evolution-records-section"
      className="bg-white rounded-[2.2rem] sm:rounded-[2.8rem] p-4 sm:p-7 border border-slate-200/80 shadow-sm space-y-5 transition-all"
    >
      {/* Encabezado: Título y Navegación de Fecha Seleccionada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                Evolución y Registros del Día
              </h3>
              {isToday ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Hoy
                </span>
              ) : (
                <button
                  onClick={handleGoToday}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                  title="Ir a la fecha de hoy"
                >
                  Volver a hoy
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Controles de Navegación de Día y Botones de Acción */}
        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          {/* Navegación anterior / siguiente día */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70 mr-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all active:scale-95"
              title="Día anterior"
              aria-label="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-black text-slate-500 px-2 select-none">
              Día {selectedDate.getDate()}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all active:scale-95"
              title="Día siguiente"
              aria-label="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón rápido + Nota */}
          {!showQuickObsForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickObsForm(true)}
              className="text-xs font-bold gap-1 text-purple-700 border-purple-200 hover:bg-purple-50 rounded-2xl px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nota</span>
            </Button>
          )}

          {/* Botón + Evento / Período */}
          {onOpenNewEventModal && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                onOpenNewEventModal(selectedDate.toISOString().split('T')[0])
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 rounded-2xl px-3 py-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sesión</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mensaje de confirmación tras registrar nota */}
      {formSuccessMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* Formulario Rápido para añadir Observación de Evolución en este día */}
      {showQuickObsForm && (
        <form
          onSubmit={handleQuickObsSubmit}
          className="p-4 sm:p-5 rounded-3xl bg-purple-50/70 border border-purple-200 space-y-3.5 animate-in fade-in transition-all"
        >
          <div className="flex items-center justify-between pb-1 border-b border-purple-200/70">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-200 text-purple-800">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                Nueva Nota de Evolución para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickObsForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              title="Cerrar formulario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Área / Categoría
              </label>
              <select
                value={obsCategory}
                onChange={(e) => setObsCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              >
                <option value="bienestar">Bienestar / Estado basal</option>
                <option value="sensorial">Sensorial y Autorregulación</option>
                <option value="conductual">Conductual / Apoyo positivo</option>
                <option value="social">Social y Comunicación</option>
                <option value="pedagogico">Pedagógico y Aprendizaje</option>
                <option value="descanso">Descanso y Sueño</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Vincular a Sesión de Agenda
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-purple-400 focus:outline-none"
              >
                <option value="">(Observación general del día)</option>
                {dayEvents.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.iconEmoji || '📅'} {ev.title} {ev.startTime ? `(${ev.startTime})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-1">
              Descripción de la Evolución / Respuesta *
            </label>
            <textarea
              rows={3}
              required
              value={obsDescription}
              onChange={(e) => setObsDescription(e.target.value)}
              placeholder="Describe cómo respondió el estudiante, avances, autorregulación o apoyos efectivos..."
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Apoyos utilizados (separados por coma)
              </label>
              <input
                type="text"
                value={obsSupports}
                onChange={(e) => setObsSupports(e.target.value)}
                placeholder="Ej. audífonos, temporizador, apoyo visual"
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Resultado observado
              </label>
              <input
                type="text"
                value={obsOutcome}
                onChange={(e) => setObsOutcome(e.target.value)}
                placeholder="Ej. Logró mantener la calma y completar la tarea"
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickObsForm(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingObs || !obsDescription.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl px-4 py-2"
            >
              {isSubmittingObs ? 'Guardando...' : 'Guardar Observación'}
            </Button>
          </div>
        </form>
      )}

      {/* Resumen de Bienestar Sensorial y Estado de Regulación del Día */}
      {somaticLog ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Estado Basal y Factores Reportados</span>
            </span>
            {somaticLog.mood && (
              <span className="text-xs font-black bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                Estado: {somaticLog.mood}
              </span>
            )}
          </div>

          {somaticLog.symptoms && somaticLog.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {somaticLog.symptoms.map((symp, i) => (
                <span
                  key={i}
                  className="text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs"
                >
                  ⚡ {symptomLabels[symp] || symp}
                </span>
              ))}
            </div>
          )}

          {somaticLog.wellbeingNote && (
            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/70">
              "{somaticLog.wellbeingNote}"
            </p>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-slate-400" />
            <span>Sin factores somáticos o sensoriales reportados para este día.</span>
          </span>
          {onOpenSensoryTracker && (
            <button
              onClick={onOpenSensoryTracker}
              className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 underline ml-2 shrink-0"
            >
              Registrar factores
            </button>
          )}
        </div>
      )}

      {/* 1. Sesiones y Eventos de la Agenda del Día */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Sesiones y Eventos de la Agenda ({dayEvents.length})</span>
          </span>
          {onOpenNewEventModal && (
            <button
              onClick={() =>
                onOpenNewEventModal(selectedDate.toISOString().split('T')[0])
              }
              className="text-sky-700 hover:text-sky-900 font-black text-[11px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir sesión</span>
            </button>
          )}
        </div>

        {dayEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dayEvents.map((ev) => (
              <div
                key={ev._id}
                className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col justify-between text-xs shadow-2xs hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{ev.iconEmoji || '📅'}</span>
                    <div className="flex items-center gap-1">
                      {ev.startTime && (
                        <span className="text-[10px] font-black text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-md border border-sky-200">
                          {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                        </span>
                      )}
                      {ev.isNonRoutine && (
                        <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          No habitual
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-black text-slate-800 text-sm leading-snug">
                    {ev.title}
                  </h4>

                  {ev.visualPrepNotes && (
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      💡 {ev.visualPrepNotes}
                    </p>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-sky-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-700">
                    {ev.alertLevel === 'cambio_fuerte'
                      ? '⚠️ Cambio importante'
                      : '📋 Sesión programada'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEventId(ev._id);
                      setObsDescription(`Evolución en sesión: ${ev.title}. `);
                      setShowQuickObsForm(true);
                    }}
                    className="text-[11px] font-black text-purple-700 hover:text-purple-900 bg-white px-2.5 py-1 rounded-xl border border-purple-200 hover:bg-purple-50 transition-all shadow-2xs flex items-center gap-1"
                  >
                    <span>📝 Anotar evolución</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 italic">
            Sin sesiones o eventos programados para este día.
          </div>
        )}
      </div>

      {/* 2. Observaciones Clínicas y Pedagógicas Registradas */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Observaciones Clínicas y Pedagógicas ({dayObservations.length})</span>
          </span>
          {!showQuickObsForm && (
            <button
              onClick={() => setShowQuickObsForm(true)}
              className="text-purple-700 hover:text-purple-900 font-black text-[11px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Registrar observación</span>
            </button>
          )}
        </div>

        {dayObservations.length > 0 ? (
          <div className="space-y-2.5">
            {dayObservations.map((obs) => {
              const catInfo = categoryLabels[obs.category] || {
                label: obs.category,
                bg: 'bg-purple-100',
                text: 'text-purple-800',
              };

              return (
                <div
                  key={obs._id}
                  className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80 text-xs space-y-2 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-lg border border-purple-200 ${catInfo.bg} ${catInfo.text}`}
                      >
                        {catInfo.label}
                      </span>
                      {obs.author && (
                        <span className="text-[11px] font-bold text-slate-500">
                          por {obs.author.name}{' '}
                          {obs.author.specialty ? `(${obs.author.specialty})` : ''}
                        </span>
                      )}
                    </div>
                    {obs.scheduleEventId && (
                      <span className="text-[10px] text-sky-800 font-bold bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                        🗓️ Sesión vinculada
                      </span>
                    )}
                  </div>

                  <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
                    {obs.description}
                  </p>

                  {obs.supportsUsed && obs.supportsUsed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Apoyos:</span>
                      {obs.supportsUsed.map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-md font-bold"
                        >
                          🌿 {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {obs.observedOutcome && (
                    <div className="pt-1 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Resultado: {obs.observedOutcome}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 italic">
            Sin observaciones clínicas registradas para esta fecha.
          </div>
        )}
      </div>

      {/* 3. Registros ABC del Día (Antecedente, Conducta, Apoyo) */}
      <div className="space-y-2.5">
        <span className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Registros ABC y Apoyo Brindado ({dayAbcLogs.length})</span>
        </span>

        {dayAbcLogs.length > 0 ? (
          <div className="space-y-2.5">
            {dayAbcLogs.map((abc) => (
              <div
                key={abc._id}
                className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-amber-950 font-black">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Registro de Apoyo y Comprensión</span>
                  </span>
                  {abc.author && (
                    <span className="text-[10px] font-bold text-slate-500">
                      {abc.author.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-white/80 border border-amber-100">
                    <span className="block text-[10px] font-black uppercase text-amber-800">
                      Antecedente
                    </span>
                    <p className="text-slate-700 mt-0.5">{abc.antecedentContext}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-amber-100">
                    <span className="block text-[10px] font-black uppercase text-amber-800">
                      Conducta
                    </span>
                    <p className="text-slate-700 mt-0.5">{abc.observedBehavior}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-amber-100">
                    <span className="block text-[10px] font-black uppercase text-emerald-800">
                      Apoyo Brindado
                    </span>
                    <p className="text-emerald-900 font-bold mt-0.5">
                      {abc.supportProvided}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 italic">
            Sin registros ABC registrados para esta fecha.
          </div>
        )}
      </div>

      {/* Estado vacío cuando no hay absolutamente nada para este día */}
      {totalEntries === 0 && !somaticLog && (
        <div className="p-6 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-700">
              Sin registros para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
              Puedes registrar una observación clínica, planificar una sesión de anticipación o anotar el estado basal.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickObsForm(true)}
              className="text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 rounded-2xl"
            >
              + Nota de Evolución
            </Button>
            {onOpenNewEventModal && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  onOpenNewEventModal(selectedDate.toISOString().split('T')[0])
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl"
              >
                + Planificar Sesión
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Enlace al módulo de seguimiento global */}
      {childId && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            ¿Deseas ver la evolución histórica y reportes clínicos?
          </span>
          <Link
            href={`/tracking?childId=${childId}`}
            className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 group"
          >
            <span>Ir a Módulo de Seguimiento</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
};
