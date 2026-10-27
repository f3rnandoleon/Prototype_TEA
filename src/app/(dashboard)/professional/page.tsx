'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, Activity, CheckCircle2, XCircle, ArrowRight, BookOpen, Sparkles, Calendar, Clock } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IChild, IChildAccess, IUser } from '@/types';

export default function ProfessionalDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [children, setChildren] = useState<IChild[]>([]);
  const [links, setLinks] = useState<IChildAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (meData.user.role !== 'professional') {
        router.push(`/${meData.user.role}`);
        return;
      }
      setCurrentUser(meData.user);

      // Cargar niños autorizados
      const childrenRes = await fetch('/api/children');
      if (childrenRes.ok) {
        const cData = await childrenRes.json();
        setChildren(cData.children || []);
      }

      // Cargar vinculaciones
      const linksRes = await fetch('/api/links');
      if (linksRes.ok) {
        const lData = await linksRes.json();
        setLinks(lData.links || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondInvitation = async (linkId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingInvitations = links.filter((l) => l.status === 'pending');
  const activeLinks = links.filter((l) => l.status === 'accepted');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Panel Profesional Clínico</span>
              <span className="text-sky-600">🩺</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Especialidad: <span className="font-bold text-sky-700">{currentUser?.specialty || 'General'}</span>.
              Seguimiento terapéutico y objetivos individualizados con autorización explícita.
            </p>
          </div>
        </div>

        {/* Invitaciones Pendientes de Aceptación */}
        {pendingInvitations.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black text-amber-900 mb-3 flex items-center gap-2">
              <span>Invitaciones Pendientes de Familias</span>
              <Badge variant="warning">{pendingInvitations.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInvitations.map((inv) => (
                <div key={inv._id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {typeof inv.childId === 'object' ? inv.childId.name : inv.child?.name || 'Perfil infantil'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Invitado por: {typeof inv.invitedBy === 'object' ? inv.invitedBy.name : 'Tutor legal'} (
                      {typeof inv.invitedBy === 'object' ? inv.invitedBy.email : 'Tutor'})
                    </p>
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Permisos propuestos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {inv.permissions.map((p, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleRespondInvitation(inv._id, 'rejected')}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      Rechazar
                    </button>
                    <Button
                      onClick={() => handleRespondInvitation(inv._id, 'accepted')}
                      variant="primary"
                      size="sm"
                      className="font-bold"
                    >
                      Aceptar Colaboración
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Niños Vinculados Autorizados */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Niños Vinculados para Apoyo Terapéutico</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{children.length} autorizados</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando niños vinculados...</div>
          ) : children.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No tienes niños vinculados actualmente. Cuando una familia te invite mediante tu correo (
              <span className="font-bold text-slate-800">{currentUser?.email}</span>), aparecerá aquí.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div key={child._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-sky-500/20">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{child.name}</h3>
                        <p className="text-xs text-slate-500">Apoyo profesional activo</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Intereses y Motivaciones:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {child.individualizedProfile?.interests?.slice(0, 3).map((item, i) => (
                            <span key={i} className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg border border-sky-100">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-500">Estrategias de calma conocidas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {child.individualizedProfile?.selfRegulationStrategies?.slice(0, 2).map((item, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Link href={`/tracking?childId=${child._id}`} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full font-bold gap-1.5 shadow-sm">
                        <Activity className="w-4 h-4" />
                        <span>Objetivos y Observaciones</span>
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link href={`/routines?childId=${child._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Rutinas</span>
                        </Button>
                      </Link>

                      <Link href={`/calendar?childId=${child._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Calendario</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
