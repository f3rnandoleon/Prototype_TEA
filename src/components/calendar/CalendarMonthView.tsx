'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { ScallopedFlowerBadge } from './ScallopedFlowerBadge';
import { IScheduleEvent, ISomaticLog, IObservation, IABCLog } from '@/types';

export interface CalendarStreak {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: 'sensibility' | 'therapy' | 'calm' | 'scheduled';
  title: string;
  color: 'rose' | 'lavender' | 'teal' | 'outlined';
}

interface CalendarMonthViewProps {
  currentDate: Date;
  onMonthChange: (newDate: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events?: IScheduleEvent[];
  somaticLogs?: ISomaticLog[];
  observations?: IObservation[];
  abcLogs?: IABCLog[];
  onOpenNewEventModal?: (defaultDate?: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  onMonthChange,
  selectedDate,
  onSelectDate,
  events = [],
  somaticLogs = [],
  observations = [],
  abcLogs = [],
  onOpenNewEventModal,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Nombres de los meses en español con primera letra mayúscula
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Navegación de mes
  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  // Construir rachas (streaks) a partir de eventos o de los registros de la bitácora
  const streaks: CalendarStreak[] = useMemo(() => {
    const list: CalendarStreak[] = [];

    // 1. Eventos con rango (startDate -> endDate)
    events.forEach((ev) => {
      if (ev.endDate && ev.endDate >= ev.date) {
        list.push({
          id: `ev-${ev._id}`,
          startDate: ev.date,
          endDate: ev.endDate,
          type: ev.alertLevel === 'cambio_fuerte' ? 'sensibility' : 'therapy',
          title: ev.title,
          color: ev.badgeStyle === 'outlined' ? 'outlined' : (ev.badgeColor === 'rose' ? 'rose' : ev.badgeColor === 'teal' ? 'teal' : 'lavender'),
        });
      }
    });

    // 2. Si no hay eventos con rango para el mes, generamos rachas visuales adaptadas de la muestra
    // Por ejemplo: días con sensibilidad (rosa) y días de terapias/calma (lavanda)
    if (list.length === 0) {
      const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
      list.push({
        id: 'streak-demo-1',
        startDate: `${yearMonth}-02`,
        endDate: `${yearMonth}-06`,
        type: 'sensibility',
        title: 'Período de sensibilidad somática',
        color: 'rose',
      });
      list.push({
        id: 'streak-demo-2',
        startDate: `${yearMonth}-12`,
        endDate: `${yearMonth}-13`,
        type: 'therapy',
        title: 'Sesiones de Fonoaudiología y Terapia',
        color: 'lavender',
      });
      list.push({
        id: 'streak-demo-3',
        startDate: `${yearMonth}-16`,
        endDate: `${yearMonth}-17`,
        type: 'therapy',
        title: 'Terapia Ocupacional e Integración',
        color: 'lavender',
      });
      list.push({
        id: 'streak-demo-4',
        startDate: `${yearMonth}-28`,
        endDate: `${yearMonth}-31`,
        type: 'scheduled',
        title: 'Anticipación: Transición de rutina',
        color: 'outlined',
      });
    }

    return list;
  }, [events, year, month]);

  // Mapa de eventos con insignia de flor (como el día 14 en la imagen)
  const flowerBadgesMap = useMemo(() => {
    const map = new Map<string, { label: string; color: 'purple' | 'rose' | 'teal' | 'indigo' | 'amber'; event: IScheduleEvent }>();
    
    events.forEach((ev) => {
      if (ev.badgeStyle === 'flower') {
        map.set(ev.date, {
          label: ev.badgeLabel || ev.title.split(' ')[0].toUpperCase(),
          color: (ev.badgeColor as any) || 'purple',
          event: ev,
        });
      }
    });

    // Si para el mes actual no hay evento de flor configurado, colocamos el de demostración en el día 14
    const defaultFlowerDate = `${year}-${String(month + 1).padStart(2, '0')}-14`;
    if (!map.has(defaultFlowerDate)) {
      map.set(defaultFlowerDate, {
        label: 'TERAPIA',
        color: 'purple',
        event: {
          _id: 'default-flower',
          childId: '',
          title: 'Sesión de Terapia Especial',
          date: defaultFlowerDate,
          iconEmoji: '🌸',
          isNonRoutine: true,
          alertLevel: 'informativo',
          createdBy: '',
          createdAt: new Date(),
        },
      });
    }

    return map;
  }, [events, year, month]);

  // Construir la matriz de días del mes
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // En JavaScript 0 es Domingo, pero queremos Lunes como primer día (0: Lunes, 6: Domingo)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Días del mes anterior
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const prevDateNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, prevDateNum);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dateNumber: prevDateNum,
        isCurrentMonth: false,
        dateStr,
      });
    }

    // Días del mes actual
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        date: d,
        dateNumber: dayNum,
        isCurrentMonth: true,
        dateStr,
      });
    }

    // Días del mes siguiente para completar múltiplos de 7 (mínimo 35 o 42 celdas)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const d = new Date(year, month + 1, nextDay);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dateNumber: nextDay,
        isCurrentMonth: false,
        dateStr,
      });
    }

    return cells;
  }, [year, month]);

  // Función para determinar si una fecha tiene una racha activa y en qué posición (inicio, medio, fin)
  const getStreakInfo = (dateStr: string, colIndex: number) => {
    for (const streak of streaks) {
      if (dateStr >= streak.startDate && dateStr <= streak.endDate) {
        const isStart = dateStr === streak.startDate || colIndex === 0;
        const isEnd = dateStr === streak.endDate || colIndex === 6;
        return {
          streak,
          isStart,
          isEnd,
          isSingle: isStart && isEnd,
        };
      }
    }
    return null;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  return (
    <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-rose-50/40 via-purple-50/20 to-teal-50/30 p-3 sm:p-7 border border-rose-100/80 shadow-xl shadow-rose-200/20 max-w-xl mx-auto backdrop-blur-xl">
      {/* Fondo con resplandores suaves tipo app móvil premium */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />

      {/* Encabezado del Mes: < Marzo > */}
      <div className="flex items-center justify-between px-1 sm:px-3 py-1 sm:py-2 mb-2 sm:mb-4">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white/80 active:scale-90 transition-all shadow-sm border border-slate-200/50"
          aria-label="Mes anterior"
          id="btn-prev-month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight select-none">
          {monthNames[month]}
          <span className="text-slate-400 font-medium text-base sm:text-lg ml-2">{year}</span>
        </h2>

        <button
          onClick={handleNextMonth}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white/80 active:scale-90 transition-all shadow-sm border border-slate-200/50"
          aria-label="Mes siguiente"
          id="btn-next-month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Días de la semana en mayúsculas estilo imagen de referencia */}
      <div className="grid grid-cols-7 mb-3 text-center">
        {daysOfWeek.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[11px] sm:text-xs font-black tracking-widest py-1 select-none ${
              idx >= 5 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Cuadrícula de fechas del calendario */}
      <div className="grid grid-cols-7 gap-y-2 relative">
        {calendarCells.map((cell, index) => {
          const colIndex = index % 7;
          const streakInfo = getStreakInfo(cell.dateStr, colIndex);
          const flowerBadge = flowerBadgesMap.get(cell.dateStr);
          const isSelected = isSameDay(cell.date, selectedDate);
          const hasSomatic = somaticLogs.some((l) => {
            const logDateStr = new Date(l.date).toISOString().split('T')[0];
            return logDateStr === cell.dateStr;
          });
          const hasObservations = observations.some((o) => {
            const oDateStr = new Date(o.date).toISOString().split('T')[0];
            return oDateStr === cell.dateStr;
          });
          const hasAbc = abcLogs.some((a) => {
            const aDateStr = new Date(a.date).toISOString().split('T')[0];
            return aDateStr === cell.dateStr;
          });
          const dayEvents = events.filter((e) => e.date === cell.dateStr);
          const hasEvents = dayEvents.length > 0;

          // Clases de estilo para las rachas conectadas
          let streakBg = '';
          let streakRounded = '';
          if (streakInfo) {
            const { color } = streakInfo.streak;
            if (color === 'rose') {
              streakBg = 'bg-[#fbcfe8]/70 text-rose-950'; // Rosa pastel como en la imagen
            } else if (color === 'lavender') {
              streakBg = 'bg-[#e0e7ff]/80 text-indigo-950'; // Lavanda pastel
            } else if (color === 'teal') {
              streakBg = 'bg-[#ccfbf1]/80 text-teal-950';
            } else if (color === 'outlined') {
              streakBg = 'border-2 border-rose-300 bg-rose-50/30 text-rose-900';
            }

            if (streakInfo.isSingle) {
              streakRounded = 'rounded-full';
            } else if (streakInfo.isStart) {
              streakRounded = 'rounded-l-full';
            } else if (streakInfo.isEnd) {
              streakRounded = 'rounded-r-full';
            } else {
              streakRounded = 'rounded-none';
            }
          }

          return (
            <div
              key={`${cell.dateStr}-${index}`}
              className="relative h-11 sm:h-14 flex items-center justify-center"
            >
              {/* Franja de racha continua de fondo (Pill Streak) */}
              {streakInfo && (
                <div
                  className={`absolute inset-y-1 sm:inset-y-1.5 z-0 transition-all ${streakBg} ${streakRounded} ${
                    streakInfo.isStart ? 'left-1' : 'left-0'
                  } ${streakInfo.isEnd ? 'right-1' : 'right-0'}`}
                  title={streakInfo.streak.title}
                />
              )}

              {/* Contenido de la celda del día */}
              {flowerBadge ? (
                /* Insignia floral scalloped especial (como día 14 de la imagen) */
                <ScallopedFlowerBadge
                  day={cell.dateNumber}
                  label={flowerBadge.label}
                  color={flowerBadge.color}
                  onClick={() => onSelectDate(cell.date)}
                  size="md"
                />
              ) : (
                /* Día regular del calendario con micro-indicadores de seguimiento */
                <button
                  onClick={() => onSelectDate(cell.date)}
                  className={`relative z-10 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center font-bold text-xs sm:text-base transition-all select-none ${
                    !cell.isCurrentMonth
                      ? 'text-slate-300 hover:text-slate-500'
                      : isSelected
                      ? 'bg-slate-900 text-white shadow-lg scale-105 ring-2 ring-slate-900 ring-offset-2'
                      : 'text-slate-700 hover:bg-white/60 active:scale-95'
                  }`}
                  aria-label={`Día ${cell.dateNumber}`}
                >
                  <span className="leading-tight">{cell.dateNumber}</span>

                  {/* Indicadores de integración entre seguimiento/evolución y calendario */}
                  {!isSelected && (
                    <div className="flex items-center gap-0.5 mt-0.5 pointer-events-none">
                      {hasObservations && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shadow-sm" title="Observación registrada" />
                      )}
                      {hasAbc && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" title="Registro ABC de apoyo" />
                      )}
                      {hasEvents && !hasObservations && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-sm" title="Sesión / Evento" />
                      )}
                      {hasSomatic && !hasObservations && !hasAbc && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm" title="Registro somático" />
                      )}
                    </div>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda interactiva de colores y patrones integrados */}
      <div className="mt-6 pt-4 border-t border-rose-200/40 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold">
          <span>Patrones y Seguimiento del Mes:</span>
          {onOpenNewEventModal && (
            <button
              onClick={() => onOpenNewEventModal(selectedDateStr)}
              className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Evento o Racha</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-[11px] font-bold">
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/60 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
            <span className="text-slate-700 truncate">Observaciones</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/60 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-700 truncate">Registros ABC</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/60 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span className="text-slate-700 truncate">Eventos / Sesiones</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/60 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
            <span className="text-slate-700 truncate">Factores Somáticos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
