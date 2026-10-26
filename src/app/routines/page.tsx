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
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IChild, IRoutine, IRoutineStep, IUser, RoutineCategory } from '@/types';

function RoutinesAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get('childId');

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || '');
  const [routines, setRoutines] = useState<IRoutine[]>([]);
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadRoutines(selectedChildId);
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

  const loadRoutines = async (childId: string) => {
    try {
      const res = await fetch(`/api/routines?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setRoutines(data.routines || []);
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
        loadRoutines(selectedChildId);
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
        loadRoutines(selectedChildId);
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
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-emerald-600" />
              <span>Gestión de Rutinas y Agenda Visual</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Crea secuencias predecibles con pasos ilustrados y horarios para brindar seguridad cognitiva al niño.
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

            <Button
              onClick={() => setShowModal(true)}
              variant="primary"
              size="md"
              className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Rutina</span>
            </Button>
          </div>
        </div>

        {/* Lista de Rutinas */}
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
                    <Link href={`/child/${selectedChildId}/schedule`} className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                      <span>Ver cómo lo ve el niño en "Mi Día"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                >
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
    </div>
  );
}

export default function RoutinesAdminPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando rutinas...</div>}>
      <RoutinesAdminContent />
    </Suspense>
  );
}

