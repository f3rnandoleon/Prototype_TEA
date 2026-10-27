'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Sparkles,
  Layers,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Users,
  Search,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IActivity, IChild, IUser, ActivityType } from '@/types';

export default function ActivitiesHubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal para Asignar
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<IActivity | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // Modal para Crear Actividad
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSkill, setNewSkill] = useState('Categorización y Atención');
  const [newType, setNewType] = useState<ActivityType>('association');
  const [newDifficulty, setNewDifficulty] = useState<'facil' | 'medio' | 'avanzado'>('facil');
  const [newInstructions, setNewInstructions] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChildId && typeof window !== 'undefined') {
      localStorage.setItem('tea_selected_child_id', selectedChildId);
    }
  }, [selectedChildId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (meData.user.role === 'professional') {
        router.push('/professional');
        return;
      }
      setCurrentUser(meData.user);

      // Cargar actividades
      const actRes = await fetch('/api/activities');
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData.activities || []);
      }

      // Cargar niños autorizados
      const childRes = await fetch('/api/children');
      if (childRes.ok) {
        const childData = await childRes.json();
        setChildren(childData.children || []);
        if (childData.children?.length > 0) {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const qChildId = urlParams?.get('childId');
          const stored = typeof window !== 'undefined' ? localStorage.getItem('tea_selected_child_id') : null;
          const match = childData.children.find((c: IChild) => c._id === qChildId) ||
                        childData.children.find((c: IChild) => c._id === stored) ||
                        childData.children[0];
          setSelectedChildId(match._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = (act: IActivity) => {
    setSelectedActivity(act);
    setAssignFeedback(null);
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !selectedChildId) return;

    try {
      const res = await fetch('/api/activities/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          activityId: selectedActivity._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAssignFeedback('¡Actividad asignada con éxito al niño!');
        setTimeout(() => {
          setShowAssignModal(false);
          setAssignFeedback(null);
        }, 1500);
      } else {
        setAssignFeedback(data.error || 'Error al asignar');
      }
    } catch {
      setAssignFeedback('Error de conexión');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();

    let config = {};
    if (newType === 'association') {
      config = {
        pairs: [
          {
            id: 'p1',
            leftText: 'Sol',
            leftImage: 'https://api.arasaac.org/api/pictograms/2453?download=false',
            rightText: 'Día',
            rightImage: 'https://api.arasaac.org/api/pictograms/2453?download=false',
          },
          {
            id: 'p2',
            leftText: 'Luna',
            leftImage: 'https://api.arasaac.org/api/pictograms/2453?download=false',
            rightText: 'Noche',
            rightImage: 'https://api.arasaac.org/api/pictograms/2453?download=false',
          },
        ],
      };
    } else if (newType === 'selection') {
      config = {
        questions: [
          {
            id: 'q1',
            promptText: '¿Cuál de estos objetos se usa para dibujar?',
            promptImage: 'https://api.arasaac.org/api/pictograms/2408?download=false',
            options: [
              {
                id: 'o1',
                text: 'Lápices de colores',
                imageUrl: 'https://api.arasaac.org/api/pictograms/2408?download=false',
                isCorrect: true,
              },
              {
                id: 'o2',
                text: 'Cuchara',
                imageUrl: 'https://api.arasaac.org/api/pictograms/2422?download=false',
                isCorrect: false,
              },
            ],
          },
        ],
      };
    } else {
      config = {
        sequence: [
          {
            id: 's1',
            order: 1,
            text: '1. Abrir el libro',
            imageUrl: 'https://api.arasaac.org/api/pictograms/2406?download=false',
          },
          {
            id: 's2',
            order: 2,
            text: '2. Leer o mirar las imágenes',
            imageUrl: 'https://api.arasaac.org/api/pictograms/2406?download=false',
          },
          {
            id: 's3',
            order: 3,
            text: '3. Cerrar y guardar',
            imageUrl: 'https://api.arasaac.org/api/pictograms/2406?download=false',
          },
        ],
      };
    }

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          skillType: newSkill,
          activityType: newType,
          difficulty: newDifficulty,
          instructions: newInstructions,
          config,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredActivities =
    selectedType === 'all'
      ? activities
      : activities.filter((a) => a.activityType === selectedType);

  const typeLabels = {
    association: '🔗 Asociación Visual',
    selection: '🎯 Selección entre Opciones',
    sequence: '🔢 Secuencias Temporales',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-amber-500" />
              <span>Biblioteca de Actividades Educativas</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Actividades adaptadas sin penalizaciones ni límites de tiempo forzados para estimular la autonomía.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="font-bold gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Actividad</span>
          </Button>
        </div>

        {/* Filtros de Tipo de Actividad */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              selectedType === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas ({activities.length})
          </button>
          <button
            onClick={() => setSelectedType('association')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              selectedType === 'association'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🔗 Tipo A: Asociación Visual
          </button>
          <button
            onClick={() => setSelectedType('selection')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              selectedType === 'selection'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🎯 Tipo B: Selección entre Opciones
          </button>
          <button
            onClick={() => setSelectedType('sequence')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              selectedType === 'sequence'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🔢 Tipo C: Secuencias Temporales
          </button>
        </div>

        {/* Lista de Actividades */}
        <section>
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando biblioteca de actividades...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No hay actividades en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((act) => (
                <div
                  key={act._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {typeLabels[act.activityType]}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                        {act.difficulty}
                      </span>
                    </div>

                    <h3 className="font-black text-lg text-slate-800 leading-tight">{act.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{act.description}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-600">Habilidad: </span>
                      <span className="text-slate-800 font-medium">{act.skillType}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenAssignModal(act)}
                      variant="primary"
                      size="sm"
                      className="flex-1 font-bold gap-1 shadow-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Asignar a Niño</span>
                    </Button>

                    {children.length > 0 && (
                      <Link href={`/child/${children[0]._id}/activities/${act._id}`}>
                        <Button variant="outline" size="sm" className="font-bold text-xs" title="Probar como niño">
                          Probar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL: Asignar Actividad a un Niño */}
      {showAssignModal && selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Asignar Actividad</h2>
            <p className="text-xs text-slate-500 mb-4">
              Actividad seleccionada: <span className="font-bold text-slate-800">{selectedActivity.title}</span>
            </p>

            {assignFeedback && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                {assignFeedback}
              </div>
            )}

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Seleccionar Niño Autorizado
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.nickname ? `(${c.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Confirmar Asignación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Actividad */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Crear Nueva Actividad Adaptada</h2>
            <p className="text-xs text-slate-500 mb-4">
              Diseña una experiencia adaptada a las fortalezas e intereses del niño.
            </p>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Reconocer animales"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Actividad</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="association">Tipo A: Asociación Visual</option>
                  <option value="selection">Tipo B: Selección entre Opciones</option>
                  <option value="sequence">Tipo C: Secuencias Temporales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Habilidad Trabajada</label>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Ej. Reconocimiento de emociones, Autonomía"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instrucciones Amables</label>
                <textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Ej. Toca cada imagen con calma para ordenarlas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Guardar en Biblioteca
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
