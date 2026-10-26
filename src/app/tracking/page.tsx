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
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IChild,
  IObservation,
  IGoal,
  IUser,
  ObservationCategory,
  GoalArea,
  GoalStatus,
} from '@/types';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get('childId');

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || '');
  const [activeTab, setActiveTab] = useState<'observations' | 'goals' | 'wellbeing'>('observations');

  const [observations, setObservations] = useState<IObservation[]>([]);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal nueva observación
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsCategory, setObsCategory] = useState<ObservationCategory>('bienestar');
  const [obsDescription, setObsDescription] = useState('');
  const [obsSupports, setObsSupports] = useState('');
  const [obsOutcome, setObsOutcome] = useState('');

  // Modal nuevo objetivo
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
      loadTrackingData(selectedChildId);
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
          setSelectedChildId(cData.children[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrackingData = async (childId: string) => {
    try {
      // 1. Observaciones
      const obsRes = await fetch(`/api/observations?childId=${childId}`);
      if (obsRes.ok) {
        const obsData = await obsRes.json();
        setObservations(obsData.observations || []);
      }

      // 2. Objetivos
      const goalRes = await fetch(`/api/goals?childId=${childId}`);
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData.goals || []);
      }
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
        }),
      });

      if (res.ok) {
        setShowObsModal(false);
        setObsDescription('');
        setObsSupports('');
        setObsOutcome('');
        loadTrackingData(selectedChildId);
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
        loadTrackingData(selectedChildId);
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
        loadTrackingData(selectedChildId);
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
        loadTrackingData(selectedChildId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const categoryBadges: Record<ObservationCategory, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
    bienestar: { label: '🌿 Bienestar', variant: 'success' },
    sensorial: { label: '💡 Sensorial', variant: 'warning' },
    descanso: { label: '☕ Descanso / Sueño', variant: 'info' },
    conductual: { label: '🧩 Autorregulación', variant: 'neutral' },
    social: { label: '👥 Interacción', variant: 'info' },
    pedagogico: { label: '📚 Pedagógico', variant: 'warning' },
  };

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
        {/* Cabecera y Selector de Niño */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-sky-600" />
              <span>Línea de Seguimiento y Objetivos</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Registro descriptivo de evolución, apoyos eficaces y metas consensuadas entre familia y equipo de apoyo.
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

            <Button
              onClick={() => {
                if (activeTab === 'goals') setShowGoalModal(true);
                else setShowObsModal(true);
              }}
              variant="primary"
              size="md"
              className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'goals' ? 'Nuevo Objetivo' : 'Nueva Nota'}</span>
            </Button>
          </div>
        </div>

        {/* Pestañas de Navegación de Seguimiento */}
        <div className="flex border-b border-slate-200 space-x-6">
          <button
            onClick={() => setActiveTab('observations')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'observations'
                ? 'border-sky-600 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Línea de Tiempo de Observaciones ({observations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`pb-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'goals'
                ? 'border-sky-600 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Objetivos Individualizados ({goals.length})</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: OBSERVACIONES Y BIENESTAR */}
        {activeTab === 'observations' && (
          <section className="space-y-4">
            {observations.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-base">No hay observaciones registradas aún</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Registra situaciones observadas, apoyos que resultaron útiles o momentos de sobrecarga.
                </p>
                <Button onClick={() => setShowObsModal(true)} variant="primary" size="sm">
                  Agregar Primera Observación
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {observations.map((obs) => (
                  <div
                    key={obs._id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={categoryBadges[obs.category]?.variant || 'neutral'}>
                          {categoryBadges[obs.category]?.label || obs.category}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(obs.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        Por: <span className="font-bold text-slate-700">{obs.author?.name || 'Equipo'}</span> (
                        {obs.author?.role})
                      </div>
                    </div>

                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {obs.description}
                    </p>

                    {obs.supportsUsed?.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 text-xs">
                        <span className="font-bold text-slate-500">Apoyos utilizados:</span>
                        <div className="flex flex-wrap gap-1">
                          {obs.supportsUsed.map((s, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100 font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {obs.observedOutcome && (
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-700">
                        <span className="font-bold">Resultado observado: </span>
                        <span>{obs.observedOutcome}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CONTENIDO PESTAÑA 2: OBJETIVOS INDIVIDUALIZADOS */}
        {activeTab === 'goals' && (
          <section className="space-y-4">
            {goals.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-base">No hay objetivos definidos</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Crea metas observables en comunicación, autonomía o regulación para orientar el trabajo conjunto.
                </p>
                <Button onClick={() => setShowGoalModal(true)} variant="primary" size="sm">
                  Proponer Objetivo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => {
                  const isReached = goal.status === 'alcanzado';
                  return (
                    <div
                      key={goal._id}
                      className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                            {areaLabels[goal.area] || goal.area}
                          </span>

                          <Badge
                            variant={
                              goal.status === 'alcanzado'
                                ? 'success'
                                : goal.status === 'en_progreso'
                                ? 'info'
                                : 'warning'
                            }
                          >
                            {goal.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {goal.description}
                        </h3>

                        <div className="mt-3 p-3 bg-sky-50 rounded-2xl border border-sky-100 text-xs">
                          <span className="font-bold text-sky-900">Criterio observable: </span>
                          <span className="text-sky-800">{goal.criteria}</span>
                        </div>

                        {/* Notas de progreso acumuladas */}
                        {goal.progressNotes?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                              Notas de Avance ({goal.progressNotes.length}):
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                              {goal.progressNotes.map((pn, i) => (
                                <div key={i} className="text-xs p-2 bg-slate-50 rounded-xl text-slate-700">
                                  <span className="font-bold">{new Date(pn.date).toLocaleDateString('es-ES')}: </span>
                                  <span>{pn.note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acciones del objetivo */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        {selectedGoalForNote === goal._id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={progressNoteText}
                              onChange={(e) => setProgressNoteText(e.target.value)}
                              placeholder="Escribe la nota de avance o ajuste..."
                              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedGoalForNote(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5"
                              >
                                Cancelar
                              </button>
                              <Button
                                onClick={() => handleAddProgressNote(goal._id)}
                                variant="primary"
                                size="sm"
                                className="font-bold text-xs"
                              >
                                Guardar Nota
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSelectedGoalForNote(goal._id)}
                              className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar nota de evolución</span>
                            </button>

                            {!isReached && (
                              <button
                                onClick={() => handleUpdateGoalStatus(goal._id, 'alcanzado')}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors"
                              >
                                Marcar Alcanzado
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL: Nueva Observación */}
      {showObsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Registrar Observación</h2>
            <p className="text-xs text-slate-500 mb-4">
              Aporta información descriptiva sobre bienestar, apoyos o vivencias del niño.
            </p>

            <form onSubmit={handleCreateObservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value as ObservationCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                >
                  <option value="bienestar">Bienestar General</option>
                  <option value="sensorial">Sobrecarga o Preferencia Sensorial</option>
                  <option value="descanso">Descanso / Sueño</option>
                  <option value="conductual">Estrategia de Autorregulación</option>
                  <option value="social">Interacción Social</option>
                  <option value="pedagogico">Desempeño Pedagógico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
                <textarea
                  rows={3}
                  required
                  value={obsDescription}
                  onChange={(e) => setObsDescription(e.target.value)}
                  placeholder="Describe con respeto y claridad la situación observada..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Apoyos Utilizados (separados por coma)
                </label>
                <input
                  type="text"
                  value={obsSupports}
                  onChange={(e) => setObsSupports(e.target.value)}
                  placeholder="Ej. Espacio de calma, Pictograma de anticipación"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resultado Observado
                </label>
                <input
                  type="text"
                  value={obsOutcome}
                  onChange={(e) => setObsOutcome(e.target.value)}
                  placeholder="Ej. Logró autorregularse en 5 minutos y retomó la actividad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
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

      {/* MODAL: Nuevo Objetivo */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Proponer Objetivo de Apoyo</h2>
            <p className="text-xs text-slate-500 mb-4">
              Define metas con criterios observables de avance.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Área</label>
                <select
                  value={goalArea}
                  onChange={(e) => setGoalArea(e.target.value as GoalArea)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                >
                  <option value="comunicacion">🗣️ Comunicación</option>
                  <option value="autonomia">🌟 Autonomía</option>
                  <option value="social">👥 Social</option>
                  <option value="cognitiva">🧠 Cognitiva</option>
                  <option value="sensorial">🌿 Regulación Sensorial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descripción del Objetivo
                </label>
                <textarea
                  rows={2}
                  required
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder="Ej. Expresar necesidad de descanso utilizando el botón permanente del SAAC..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Criterio Observable de Avance
                </label>
                <input
                  type="text"
                  required
                  value={goalCriteria}
                  onChange={(e) => setGoalCriteria(e.target.value)}
                  placeholder="Ej. Lo realiza de forma espontánea en al menos 3 ocasiones por semana"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
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

