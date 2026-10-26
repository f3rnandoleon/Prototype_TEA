'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Activity, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IChild, IChildAccess, IUser } from '@/types';

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [students, setStudents] = useState<IChild[]>([]);
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
      if (meData.user.role !== 'teacher') {
        router.push(`/${meData.user.role}`);
        return;
      }
      setCurrentUser(meData.user);

      const childrenRes = await fetch('/api/children');
      if (childrenRes.ok) {
        const cData = await childrenRes.json();
        setStudents(cData.children || []);
      }

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Panel Docente / Educativo</span>
              <span className="text-amber-600">📚</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Diseña actividades educativas inclusivas, consulta apoyos visuales y registra observaciones pedagógicas.
            </p>
          </div>

          <Link href="/activities">
            <Button variant="primary" className="gap-2 font-bold shadow-sm">
              <BookOpen className="w-4 h-4" />
              <span>Biblioteca de Actividades</span>
            </Button>
          </Link>
        </div>

        {/* Invitaciones Pendientes */}
        {pendingInvitations.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black text-amber-900 mb-3 flex items-center gap-2">
              <span>Invitaciones Escolares Pendientes</span>
              <Badge variant="warning">{pendingInvitations.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInvitations.map((inv) => (
                <div key={inv._id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {typeof inv.childId === 'object' ? inv.childId.name : inv.child?.name || 'Estudiante'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Invitado por la familia ({typeof inv.invitedBy === 'object' ? inv.invitedBy.email : 'Tutor'})
                    </p>
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
                      Aceptar y Conectar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Estudiantes Vinculados */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>Estudiantes Vinculados en el Aula</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{students.length} estudiantes</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando estudiantes...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No tienes estudiantes vinculados en este momento. Las familias de tus alumnos pueden agregarte con tu correo:
              <span className="font-bold text-slate-800"> {currentUser?.email}</span>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{student.name}</h3>
                        <p className="text-xs text-slate-500">Estudiante autorizado</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Apoyos visuales preferidos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.individualizedProfile?.preferredVisualSupports?.map((item, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100 font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-500">Motivaciones en clase:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.individualizedProfile?.interests?.slice(0, 3).map((item, i) => (
                            <span key={i} className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg border border-sky-100">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Link href={`/activities?childId=${student._id}`} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full font-bold gap-1.5 shadow-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>Asignar Actividad Educativa</span>
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link href={`/tracking?childId=${student._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Notas Pedagógicas</span>
                        </Button>
                      </Link>

                      <Link href={`/routines?childId=${student._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Rutina Aula</span>
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
