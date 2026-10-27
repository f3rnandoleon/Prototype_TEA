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
  Edit3,
  Trash2,
  UserMinus,
  UserPlus,
  Play,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ActivityFormModal } from '@/components/activities/ActivityFormModal';
import { IActivity, IChild, IUser, ActivityType, IActivityAssignment } from '@/types';

export default function ActivitiesHubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [children, setChildren] = useState<IChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [assignments, setAssignments] = useState<IActivityAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'assigned'>('catalog');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal para Asignar
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activityToAssign, setActivityToAssign] = useState<IActivity | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // Modal para Crear o Editar Actividad
  const [showFormModal, setShowFormModal] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<IActivity | null>(null);

  // Modal confirmación para desasignar o eliminar
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'unassign' | 'delete-activity';
    id: string; // assignmentId o activityId
    title: string;
  } | null>(null);

  // Notificaciones flotantes
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tea_selected_child_id', selectedChildId);
      }
      loadAssignments(selectedChildId);
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
        const loadedChildren = childData.children || [];
        setChildren(loadedChildren);

        if (loadedChildren.length > 0) {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const qChildId = urlParams?.get('childId');
          const stored = typeof window !== 'undefined' ? localStorage.getItem('tea_selected_child_id') : null;
          const match =
            loadedChildren.find((c: IChild) => c._id === qChildId) ||
            loadedChildren.find((c: IChild) => c._id === stored) ||
            loadedChildren[0];

          setSelectedChildId(match._id);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error al cargar la información', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async (childId: string) => {
    try {
      const res = await fetch(`/api/activities/assign?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Error al cargar asignaciones:', e);
    }
  };

  // Abrir modal de asignación
  const handleOpenAssignModal = (act: IActivity) => {
    setActivityToAssign(act);
    setDueDateInput('');
    setAssignFeedback(null);
    setShowAssignModal(true);
  };

  // Confirmar Asignación
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityToAssign || !selectedChildId) return;

    try {
      const res = await fetch('/api/activities/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          activityId: activityToAssign._id,
          dueDate: dueDateInput || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAssignFeedback('¡Actividad asignada con éxito!');
        showToast('Actividad asignada al niño correctamente.');
        await loadAssignments(selectedChildId);
        setTimeout(() => {
          setShowAssignModal(false);
          setAssignFeedback(null);
        }, 800);
      } else {
        setAssignFeedback(data.error || 'Error al asignar');
      }
    } catch {
      setAssignFeedback('Error de conexión con el servidor');
    }
  };

  // Desasignar Actividad
  const handleConfirmUnassign = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/activities/assign?id=${assignmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Actividad desasignada correctamente');
        await loadAssignments(selectedChildId);
        setActionConfirm(null);
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al desasignar actividad', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de red al desasignar', 'error');
    }
  };

  // Desasignar por Actividad y Niño (directo desde el card)
  const handleUnassignByActivity = (activityId: string, activityTitle: string) => {
    const asg = assignments.find((a) => {
      const actId = typeof a.activityId === 'object' ? (a.activityId as IActivity)?._id : a.activityId;
      return actId === activityId;
    });

    if (asg) {
      setActionConfirm({
        type: 'unassign',
        id: asg._id,
        title: activityTitle,
      });
    }
  };

  // Eliminar Actividad de la biblioteca
  const handleConfirmDeleteActivity = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Actividad eliminada de la biblioteca');
        setActionConfirm(null);
        // Recargar actividades y asignaciones
        const actRes = await fetch('/api/activities');
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData.activities || []);
        }
        if (selectedChildId) {
          loadAssignments(selectedChildId);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al eliminar actividad', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión', 'error');
    }
  };

  // Abrir Modal de Edición
  const handleOpenEditModal = (act: IActivity) => {
    setActivityToEdit(act);
    setShowFormModal(true);
  };

  // Abrir Modal de Creación
  const handleOpenCreateModal = () => {
    setActivityToEdit(null);
    setShowFormModal(true);
  };

  // Callback de éxito del formulario de actividad
  const handleActivityFormSuccess = async () => {
    showToast(
      activityToEdit
        ? 'Actividad adaptada actualizada con éxito'
        : 'Nueva actividad creada con éxito en la biblioteca'
    );
    const actRes = await fetch('/api/activities');
    if (actRes.ok) {
      const actData = await actRes.json();
      setActivities(actData.activities || []);
    }
  };

  // Mapeo rápido de asignaciones del niño seleccionado
  const assignedActivityIds = new Set(
    assignments.map((a) =>
      typeof a.activityId === 'object' ? (a.activityId as IActivity)?._id : a.activityId
    )
  );

  const selectedChild = children.find((c) => c._id === selectedChildId);

  // Filtrado de actividades del catálogo
  const filteredActivities = activities.filter((act) => {
    const matchesType = selectedType === 'all' || act.activityType === selectedType;
    const matchesSearch =
      searchFilter === '' ||
      act.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      act.skillType.toLowerCase().includes(searchFilter.toLowerCase()) ||
      act.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  const typeLabels: Record<string, string> = {
    association: '🔗 Tipo A: Asociación Visual',
    selection: '🎯 Tipo B: Selección entre Opciones',
    sequence: '🔢 Tipo C: Secuencias Temporales',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera Principal */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <span>Biblioteca de Actividades Educativas Adaptadas</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Diseña, edita y asigna experiencias adaptadas a las fortalezas de cada niño con pictogramas ARASAAC,
              pasos secuenciados y respuestas visuales sin penalizaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button
              onClick={handleOpenCreateModal}
              variant="primary"
              className="font-bold gap-2 shadow-md py-3 px-5 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Nueva Actividad</span>
            </Button>
          </div>
        </div>

        {/* Barra de Contexto: Selector de Niño y Pestañas */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Selector de Niño */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 md:flex-initial">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Niño para Asignaciones
              </label>
              {children.length > 0 ? (
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full md:w-64 px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.nickname ? `(${c.nickname})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-400">Sin niños vinculados</span>
              )}
            </div>
          </div>

          {/* Selector de Pestañas: Catálogo vs Asignadas */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo General ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'assigned'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Asignadas al Niño</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'assigned' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {assignments.length}
              </span>
            </button>
          </div>
        </div>

        {/* VISTA 1: CATÁLOGO DE ACTIVIDADES */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filtros y Buscador */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filtros por tipo de actividad */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    selectedType === 'all'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todas ({activities.length})
                </button>
                <button
                  onClick={() => setSelectedType('association')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    selectedType === 'association'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🔗 Asociación
                </button>
                <button
                  onClick={() => setSelectedType('selection')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    selectedType === 'selection'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🎯 Selección
                </button>
                <button
                  onClick={() => setSelectedType('sequence')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    selectedType === 'sequence'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🔢 Secuencias
                </button>
              </div>

              {/* Input de Búsqueda */}
              <div className="relative min-w-[16rem]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar actividad o habilidad..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Listado de Tarjetas */}
            {isLoading ? (
              <div className="p-16 text-center text-slate-400 font-bold">
                Cargando biblioteca de actividades adaptadas...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
                No se encontraron actividades con los filtros seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((act) => {
                  const isAssigned = assignedActivityIds.has(act._id);
                  const pairsCount = act.config?.pairs?.length || 0;
                  const questionsCount = act.config?.questions?.length || 0;
                  const stepsCount = act.config?.sequence?.length || 0;

                  return (
                    <div
                      key={act._id}
                      className={`bg-white rounded-3xl border-2 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                        isAssigned ? 'border-amber-400/80 ring-2 ring-amber-100' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Cabecera del Card */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-black uppercase text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {typeLabels[act.activityType] || act.activityType}
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                            {act.difficulty}
                          </span>
                        </div>

                        {/* Indicador de Asignada */}
                        {isAssigned && selectedChild && (
                          <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-800">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Asignada a {selectedChild.nickname || selectedChild.name}</span>
                            </span>
                          </div>
                        )}

                        <h3 className="font-black text-lg text-slate-800 leading-tight">{act.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>

                        {/* Resumen de configuración visual */}
                        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500">Habilidad:</span>
                            <span className="font-black text-slate-700">{act.skillType}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Contenido adaptado:</span>
                            <span className="font-bold text-amber-700">
                              {act.activityType === 'association' && `${pairsCount} parejas con pictogramas`}
                              {act.activityType === 'selection' && `${questionsCount} pregunta(s) con opciones`}
                              {act.activityType === 'sequence' && `${stepsCount} pasos en orden`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          {/* Asignar o Desasignar */}
                          {isAssigned ? (
                            <Button
                              onClick={() => handleUnassignByActivity(act._id, act.title)}
                              variant="outline"
                              size="sm"
                              className="flex-1 font-bold text-xs gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50"
                              title="Desasignar actividad a este niño"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Desasignar</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleOpenAssignModal(act)}
                              variant="primary"
                              size="sm"
                              className="flex-1 font-bold text-xs gap-1.5 shadow-sm"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Asignar a Niño</span>
                            </Button>
                          )}

                          {/* Botón Editar Actividad */}
                          <Button
                            onClick={() => handleOpenEditModal(act)}
                            variant="outline"
                            size="sm"
                            className="font-bold text-xs gap-1 text-slate-700 border-slate-300 hover:bg-slate-100"
                            title="Editar título, pictogramas, pasos o preguntas"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Editar</span>
                          </Button>
                        </div>

                        {/* Fila secundaria: Probar y Eliminar */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                          {selectedChildId && (
                            <Link
                              href={`/child/${selectedChildId}/activities/${act._id}`}
                              className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-amber-500" />
                              <span>Probar como niño</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActionConfirm({
                                type: 'delete-activity',
                                id: act._id,
                                title: act.title,
                              })
                            }
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-auto"
                            title="Eliminar actividad de la biblioteca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: ACTIVIDADES ASIGNADAS AL NIÑO */}
        {activeTab === 'assigned' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Actividades Asignadas a {selectedChild?.name || 'este niño'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestiona las actividades asignadas para su realización. Puedes desasignar o probarlas en cualquier momento.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('catalog')}
                className="font-bold text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Asignar Más Actividades</span>
              </Button>
            </div>

            {assignments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <p className="text-slate-500 font-bold text-sm">
                  {selectedChild?.name || 'El niño'} aún no tiene actividades asignadas.
                </p>
                <Button
                  onClick={() => setActiveTab('catalog')}
                  variant="primary"
                  size="sm"
                  className="font-bold"
                >
                  Explorar Catálogo y Asignar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((asg) => {
                  const act = (asg.activityId as unknown as IActivity) || asg.activity;
                  if (!act) return null;
                  const isCompleted = asg.status === 'completed';

                  return (
                    <div
                      key={asg._id}
                      className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            {typeLabels[act.activityType] || act.activityType}
                          </span>

                          <span
                            className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isCompleted ? '✓ Completada' : 'Pendiente'}
                          </span>
                        </div>

                        <h3 className="font-black text-lg text-slate-800 leading-tight">{act.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>

                        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Asignada:</span>
                            <span className="font-bold text-slate-700">
                              {new Date(asg.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {asg.dueDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Fecha límite:</span>
                              <span className="font-bold text-amber-600">
                                {new Date(asg.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Botón Desasignar */}
                        <Button
                          onClick={() =>
                            setActionConfirm({
                              type: 'unassign',
                              id: asg._id,
                              title: act.title,
                            })
                          }
                          variant="outline"
                          size="sm"
                          className="font-bold text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Desasignar</span>
                        </Button>

                        {/* Botón Probar / Jugar */}
                        <Link
                          href={`/child/${selectedChildId}/activities/${act._id}?asgId=${asg._id}`}
                        >
                          <Button variant="primary" size="sm" className="font-bold text-xs gap-1 shadow-sm">
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Abrir actividad</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ASIGNAR ACTIVIDAD */}
      {showAssignModal && activityToAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-1">Asignar Actividad</h2>
            <p className="text-xs text-slate-500 mb-4">
              Actividad seleccionada: <span className="font-bold text-slate-800">{activityToAssign.title}</span>
            </p>

            {assignFeedback && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                {assignFeedback}
              </div>
            )}

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Niño Autorizado
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.nickname ? `(${c.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Fecha estimada o límite (Opcional)
                </label>
                <input
                  type="date"
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold shadow-md">
                  Confirmar Asignación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR DESASIGNACIÓN O ELIMINACIÓN */}
      {actionConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              {actionConfirm.type === 'unassign' ? (
                <UserMinus className="w-6 h-6" />
              ) : (
                <Trash2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {actionConfirm.type === 'unassign'
                  ? '¿Desasignar actividad?'
                  : '¿Eliminar actividad?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {actionConfirm.type === 'unassign'
                  ? `Se quitará la asignación de "${actionConfirm.title}" para ${selectedChild?.name || 'este niño'}. Podrás reasignarla en cualquier momento.`
                  : `Se eliminará permanentemente la actividad "${actionConfirm.title}" de la biblioteca.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionConfirm(null)}
                className="font-bold text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (actionConfirm.type === 'unassign') {
                    handleConfirmUnassign(actionConfirm.id);
                  } else {
                    handleConfirmDeleteActivity(actionConfirm.id);
                  }
                }}
                className="font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionConfirm.type === 'unassign' ? 'Confirmar Desasignación' : 'Sí, Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR O EDITAR ACTIVIDAD (CON PASOS, PICTOGRAMAS Y RESPUESTA CORRECTA) */}
      <ActivityFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setActivityToEdit(null);
        }}
        onSuccess={handleActivityFormSuccess}
        initialActivity={activityToEdit}
      />
    </div>
  );
}
