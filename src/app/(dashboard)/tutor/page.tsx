'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Baby,
  Plus,
  Users,
  Shield,
  Activity,
  Heart,
  Sparkles,
  Settings,
  Trash2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IChild, IChildAccess, IAuditLog, IUser } from '@/types';

export default function TutorDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [links, setLinks] = useState<IChildAccess[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de modales
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedChildForInvite, setSelectedChildForInvite] = useState<string>('');

  // Formulario nuevo niño
  const [newChildName, setNewChildName] = useState('');
  const [newChildNickname, setNewChildNickname] = useState('');
  const [newChildInterests, setNewChildInterests] = useState('Dinosaurios, Trenes, Música');
  const [newChildSensory, setNewChildSensory] = useState('Luz tenue, Audífonos de cancelación');
  const [newChildCommunication, setNewChildCommunication] = useState('Pictogramas SAAC, Gestos');
  const [newChildSupports, setNewChildSupports] = useState('Agenda visual vertical');
  const [newChildRegulation, setNewChildRegulation] = useState('Espacio de calma, Balanceo suave');
  const [newChildDiscomforts, setNewChildDiscomforts] = useState('Ruidos fuertes imprevistos');
  const [newChildNotes, setNewChildNotes] = useState('');
  const [newChildCols, setNewChildCols] = useState<2 | 3 | 4 | 6>(4);

  // Formulario invitar profesional/docente
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'professional' | 'teacher'>('professional');
  const [invitePermissions, setInvitePermissions] = useState<string[]>([
    'child.profile.read',
    'routine.read',
    'observation.create',
    'observation.read',
  ]);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar usuario actual
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);

      // 2. Cargar perfiles infantiles
      const childrenRes = await fetch('/api/children');
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(childrenData.children || []);
        if (childrenData.children?.length > 0 && !selectedChildForInvite) {
          setSelectedChildForInvite(childrenData.children[0]._id);
        }
      }

      // 3. Cargar vinculaciones
      const linksRes = await fetch('/api/links');
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData.links || []);
      }

      // 4. Cargar logs de auditoría
      const auditRes = await fetch('/api/audit');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName,
          nickname: newChildNickname || undefined,
          individualizedProfile: {
            interests: newChildInterests.split(',').map((s) => s.trim()).filter(Boolean),
            sensoryPreferences: newChildSensory.split(',').map((s) => s.trim()).filter(Boolean),
            communicationModes: newChildCommunication.split(',').map((s) => s.trim()).filter(Boolean),
            preferredVisualSupports: newChildSupports.split(',').map((s) => s.trim()).filter(Boolean),
            selfRegulationStrategies: newChildRegulation.split(',').map((s) => s.trim()).filter(Boolean),
            knownDiscomforts: newChildDiscomforts.split(',').map((s) => s.trim()).filter(Boolean),
            notes: newChildNotes,
          },
          accessibility: {
            fontSize: 'large',
            buttonSize: 'large',
            contrast: 'normal',
            reducedMotion: true,
            soundEnabled: true,
            voiceTtsEnabled: true,
            voiceSpeed: 0.9,
            columnsCount: newChildCols,
          },
        }),
      });

      if (res.ok) {
        setShowAddChildModal(false);
        setNewChildName('');
        setNewChildNickname('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al crear perfil');
      }
    } catch (e) {
      console.error('Error al crear perfil:', e);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteFeedback(null);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildForInvite,
          email: inviteEmail,
          role: inviteRole,
          permissions: invitePermissions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteFeedback('¡Invitación generada exitosamente!');
        setInviteEmail('');
        loadData();
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteFeedback(null);
        }, 1500);
      } else {
        setInviteFeedback(data.error || 'Error al invitar usuario');
      }
    } catch {
      setInviteFeedback('Error de conexión');
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar el acceso a este usuario? Ya no podrá consultar este perfil.')) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error('Error al revocar:', e);
    }
  };

  const togglePermission = (perm: string) => {
    setInvitePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera y Bienvenida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Panel de Tutor Legal</span>
              <span className="text-emerald-600">🌿</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Administra perfiles infantiles, apoderados, rutinas y permisos con máxima privacidad y control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddChildModal(true)}
              variant="primary"
              className="gap-2 shadow-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Perfil Infantil</span>
            </Button>
          </div>
        </div>

        {/* Sección: Perfiles Infantiles */}
        <section aria-labelledby="children-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="children-heading" className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Baby className="w-5 h-5 text-emerald-600" />
              <span>Perfiles Infantiles Registrados</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              {children.length} {children.length === 1 ? 'perfil' : 'perfiles'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando perfiles...</div>
          ) : children.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Baby className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Aún no has registrado ningún niño</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Comienza creando un perfil para configurar su comunicador SAAC, su agenda y sus apoyos visuales.
              </p>
              <Button onClick={() => setShowAddChildModal(true)} variant="primary" size="md">
                Crear Primer Perfil
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div
                  key={child._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-emerald-500/20">
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-slate-800 leading-tight">
                            {child.name}
                          </h3>
                          {child.nickname && (
                            <p className="text-xs text-slate-500 font-medium">"{child.nickname}"</p>
                          )}
                          <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {child.accessibility.columnsCount} columnas SAAC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Intereses y Apoyos */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Intereses:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {child.individualizedProfile.interests.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg border border-sky-100 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-500">Apoyos preferidos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {child.individualizedProfile.preferredVisualSupports.slice(0, 2).map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones principales del niño */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Link href={`/child/${child._id}`} className="w-full">
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold gap-2 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Abrir Modo Niño</span>
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link href={`/routines?childId=${child._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Rutinas</span>
                        </Button>
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedChildForInvite(child._id);
                          setShowInviteModal(true);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                        title="Vincular profesional o docente"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Vincular</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sección: Vinculaciones y Permisos */}
        <section aria-labelledby="links-heading" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="links-heading" className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>Equipo Multidisciplinario Vinculado</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controla exactamente qué docentes o terapeutas pueden ver y qué permisos específicos tienen.
              </p>
            </div>

            {children.length > 0 && (
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="outline"
                size="sm"
                className="gap-1 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invitar</span>
              </Button>
            )}
          </div>

          {links.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-100">
              No hay docentes ni profesionales vinculados aún. Haz clic en "Invitar" para conectar a su equipo de apoyo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500 rounded-xl">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Profesional / Docente</th>
                    <th className="px-4 py-3">Rol / Especialidad</th>
                    <th className="px-4 py-3">Niño Vinculado</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Permisos Concedidos</th>
                    <th className="px-4 py-3 rounded-r-xl text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((link) => (
                    <tr key={link._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {link.user?.name || 'Usuario'}
                        <div className="text-xs text-slate-400 font-normal">{link.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">
                        {link.role === 'professional' ? '🩺 Profesional' : '📚 Docente'}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">
                        {link.child?.name || 'Perfil infantil'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            link.status === 'accepted'
                              ? 'success'
                              : link.status === 'pending'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {link.status === 'accepted'
                            ? 'Activo'
                            : link.status === 'pending'
                            ? 'Pendiente'
                            : 'Revocado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {link.permissions.map((p, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {p.replace('.', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {link.status !== 'revoked' && (
                          <button
                            onClick={() => handleRevokeLink(link._id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sección: Registro de Auditoría y Transparencia */}
        <section aria-labelledby="audit-heading" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="audit-heading" className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Auditoría de Seguridad y Trazabilidad</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro inmutable de accesos sensibles, modificaciones de permisos y exportaciones para tu tranquilidad.
              </p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No hay eventos registrados.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {auditLogs.slice(0, 10).map((log, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{log.resource}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL: Crear Perfil Infantil */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Nuevo Perfil Infantil</h2>
            <p className="text-xs text-slate-500 mb-6">
              Personaliza el entorno de acuerdo a sus intereses y necesidades sensoriales específicas.
            </p>

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="Ej. Mateo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Apodo / Nombre Preferido</label>
                  <input
                    type="text"
                    value={newChildNickname}
                    onChange={(e) => setNewChildNickname(e.target.value)}
                    placeholder="Ej. Mati"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Intereses y Motivaciones (separados por coma)
                </label>
                <input
                  type="text"
                  value={newChildInterests}
                  onChange={(e) => setNewChildInterests(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Preferencias Sensoriales (Luz, texturas, sonido)
                </label>
                <input
                  type="text"
                  value={newChildSensory}
                  onChange={(e) => setNewChildSensory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Estrategias de Autorregulación
                </label>
                <input
                  type="text"
                  value={newChildRegulation}
                  onChange={(e) => setNewChildRegulation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Situaciones de Malestar
                  </label>
                  <input
                    type="text"
                    value={newChildDiscomforts}
                    onChange={(e) => setNewChildDiscomforts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Columnas SAAC en Pantalla
                  </label>
                  <select
                    value={newChildCols}
                    onChange={(e) => setNewChildCols(Number(e.target.value) as 2 | 3 | 4 | 6)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={2}>2 Columnas (Botonera muy grande)</option>
                    <option value={3}>3 Columnas</option>
                    <option value={4}>4 Columnas (Estándar recomendado)</option>
                    <option value={6}>6 Columnas (Mayor densidad)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddChildModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Guardar Perfil y Generar SAAC
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Invitar Profesional / Docente */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Vincular Profesional o Docente</h2>
            <p className="text-xs text-slate-500 mb-4">
              Concede acceso controlado para que colaboren en el seguimiento de tu hijo/a.
            </p>

            {inviteFeedback && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                {inviteFeedback}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Perfil Infantil</label>
                <select
                  value={selectedChildForInvite}
                  onChange={(e) => setSelectedChildForInvite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.nickname ? `(${c.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico del Usuario Registrado
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="profesional@correo.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol de Vinculación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteRole('professional');
                      setInvitePermissions((prev) => prev.filter((p) => p !== 'activity.assign' && p !== 'activity.create'));
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      inviteRole === 'professional'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-400'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🩺 Profesional Clínico
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole('teacher')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      inviteRole === 'teacher'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    📚 Docente / Aula
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Permisos Autorizados Específicos
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
                  {[
                    { id: 'child.profile.read', label: 'Ver perfil y apoyos visuales' },
                    { id: 'routine.read', label: 'Consultar rutinas y agenda' },
                    ...(inviteRole === 'teacher' ? [{ id: 'activity.assign', label: 'Asignar actividades educativas de aula' }] : []),
                    { id: 'observation.create', label: inviteRole === 'professional' ? 'Registrar observaciones clínicas/terapéuticas' : 'Registrar observaciones pedagógicas' },
                    { id: 'observation.read', label: 'Leer historial de observaciones' },
                    { id: 'goal.create', label: inviteRole === 'professional' ? 'Proponer objetivos terapéuticos PEI' : 'Proponer objetivos pedagógicos' },
                    { id: 'goal.update', label: 'Actualizar avance de objetivos' },
                  ].map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-800 font-medium">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="secondary" className="font-bold">
                  Enviar Invitación Segura
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
