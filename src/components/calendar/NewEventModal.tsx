'use client';

import React, { useState } from 'react';
import { X, Calendar, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  defaultDate?: string;
  onEventCreated: () => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  childId,
  defaultDate,
  onEventCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [iconEmoji, setIconEmoji] = useState('🧩');
  const [badgeStyle, setBadgeStyle] = useState<'flower' | 'pill' | 'outlined'>('flower');
  const [badgeColor, setBadgeColor] = useState<string>('indigo');
  const [badgeLabel, setBadgeLabel] = useState('TERAPIA');
  const [alertLevel, setAlertLevel] = useState<'informativo' | 'importante' | 'cambio_fuerte'>('informativo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/schedule/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          title,
          description,
          date,
          endDate: isRange ? endDate : '',
          startTime,
          iconEmoji,
          badgeStyle,
          badgeColor,
          badgeLabel: badgeLabel || title.split(' ')[0].toUpperCase(),
          alertLevel,
          isNonRoutine: true,
        }),
      });

      if (res.ok) {
        onEventCreated();
        onClose();
        setTitle('');
        setDescription('');
        setEndDate('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm sm:text-base">Añadir Evento o Período de Anticipación</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Programa sesiones de terapia, hitos o períodos de transición
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Nombre de la Sesión o Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Fonoaudiología, Cita Odontológica, Semana de Adaptación"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Selector de ícono rápido para TEA */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Apoyo Visual / Ícono Clave
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { emoji: '🧩', label: 'Terapia' },
                { emoji: '🌟', label: 'Hito/Logro' },
                { emoji: '💬', label: 'Fonoaudiología' },
                { emoji: '🏃', label: 'T. Ocupacional' },
                { emoji: '🩺', label: 'Médico' },
                { emoji: '🌿', label: 'Calma' },
                { emoji: '🎧', label: 'Sensorial' },
                { emoji: '🏫', label: 'Escuela' },
              ].map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setIconEmoji(item.emoji)}
                  className={`px-2.5 py-1.5 rounded-xl border text-sm flex items-center gap-1 shrink-0 transition-all ${
                    iconEmoji === item.emoji
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm scale-105'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de elemento visual adaptado a TEA */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Resalte en el Calendario
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBadgeStyle('flower');
                  setIsRange(false);
                }}
                className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all ${
                  badgeStyle === 'flower'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">🌟</span>
                <span>Insignia de Terapia</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBadgeStyle('pill');
                  setIsRange(true);
                }}
                className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all ${
                  badgeStyle === 'pill'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">🗓️</span>
                <span>Período de Anticipación</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBadgeStyle('outlined');
                  setIsRange(false);
                }}
                className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all ${
                  badgeStyle === 'outlined'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">🌿</span>
                <span>Día de Calma</span>
              </button>
            </div>
          </div>

          {/* Si es estilo insignia: Etiqueta dentro del badge */}
          {badgeStyle === 'flower' && (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Texto en la Insignia (Máx. 9 caracteres)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="TERAPIA, LOGRO, CITA, CALMA..."
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value.toUpperCase())}
                className="w-full text-sm p-3 rounded-2xl border border-slate-200 uppercase font-black tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Selector de color */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Color de Identificación
            </label>
            <div className="flex items-center space-x-3">
              {[
                { id: 'indigo', bg: 'bg-[#6366f1]', name: 'Índigo (Terapias)' },
                { id: 'teal', bg: 'bg-[#10b981]', name: 'Menta / Esmeralda (Regulación)' },
                { id: 'amber', bg: 'bg-[#f59e0b]', name: 'Ámbar (Hito o Logro)' },
                { id: 'purple', bg: 'bg-[#8b5cf6]', name: 'Violeta (Pedagógico)' },
                { id: 'rose', bg: 'bg-[#0ea5e9]', name: 'Azul Cielo (Anticipación)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBadgeColor(c.id)}
                  className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                    badgeColor === c.id ? 'ring-4 ring-indigo-200 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {isRange && (
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Fin (Período) *
                </label>
                <input
                  type="date"
                  required={isRange}
                  min={date}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Opcional: ¿Es período continuo? */}
          {badgeStyle !== 'flower' && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="check-range"
                checked={isRange}
                onChange={(e) => setIsRange(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="check-range" className="text-xs font-bold text-slate-700 cursor-pointer">
                Extender como período continuo de varios días (Transición)
              </label>
            </div>
          )}

          {/* Nivel de Alerta / Anticipación */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Nivel de Anticipación y Apoyo Visual Requerido
            </label>
            <select
              value={alertLevel}
              onChange={(e) => setAlertLevel(e.target.value as any)}
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="informativo">🟢 Habitual / Baja demanda (Sin alteración significativa)</option>
              <option value="importante">🟡 Importante (Anticipar con apoyos visuales o historias sociales)</option>
              <option value="cambio_fuerte">🔴 Cambio Fuerte (Nuevo entorno o estímulos intensos; preparar rincón de calma)</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 flex items-center justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar en Calendario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
