'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, CheckCircle2, Play, ArrowRight, Heart } from 'lucide-react';
import { ChildHeader } from '@/components/child/ChildHeader';
import { Button } from '@/components/ui/Button';
import { useSpeechSynthesis } from '@/features/aac/useSpeechSynthesis';
import { IActivity, IActivityAssignment, IChild } from '@/types';

interface KidActivitiesPageProps {
  params: {
    childId: string;
  };
}

export default function KidActivitiesPage({ params }: KidActivitiesPageProps) {
  const { childId } = params;
  const [child, setChild] = useState<IChild | null>(null);
  const [assignments, setAssignments] = useState<IActivityAssignment[]>([]);
  const [generalActivities, setGeneralActivities] = useState<IActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.child) setChild(data.child);
      });

    // Cargar actividades asignadas al niño
    fetch(`/api/activities/assign?childId=${childId}`)
      .then((res) => res.json())
      .then((data) => {
        setAssignments(data.assignments || []);
      })
      .finally(() => setIsLoading(false));

    // Cargar también las actividades generales
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => {
        setGeneralActivities(data.activities || []);
      });
  }, [childId]);

  const typeIcons: Record<string, string> = {
    association: '🔗',
    selection: '🎯',
    sequence: '🔢',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-slate-50 to-orange-50 flex flex-col select-none">
      <ChildHeader
        childName={child?.nickname || child?.name || 'Amigo'}
        childId={childId}
        currentSectionTitle="Actividades y Juegos"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Tus Actividades Adaptadas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            Juega a tu propio ritmo. Puedes repetir las actividades las veces que quieras.
          </p>
        </div>

        {/* Asignadas específicamente */}
        {assignments.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Asignadas para ti:</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((asg) => {
                const act = asg.activityId as unknown as IActivity;
                if (!act) return null;
                const isCompleted = asg.status === 'completed';

                return (
                  <Link
                    key={asg._id}
                    href={`/child/${childId}/activities/${act._id}?asgId=${asg._id}`}
                    onClick={() => speak(`Actividad: ${act.title}`)}
                    className="block p-6 rounded-4xl bg-white border-4 border-amber-300 hover:border-amber-500 shadow-lg hover:shadow-xl active:scale-95 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{typeIcons[act.activityType] || '⭐'}</span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completada</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-800 mt-3 leading-tight">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Empezar actividad</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                      <Play className="w-5 h-5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Todas las actividades disponibles */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-500" />
            <span>Biblioteca de Aprendizaje:</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generalActivities.map((act) => (
              <Link
                key={act._id}
                href={`/child/${childId}/activities/${act._id}`}
                onClick={() => speak(`Actividad: ${act.title}`)}
                className="block p-5 rounded-3xl bg-white border-3 border-slate-200 hover:border-sky-400 shadow-md hover:shadow-lg active:scale-95 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{typeIcons[act.activityType] || '⭐'}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {act.skillType}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-800 group-hover:text-sky-700 leading-tight">
                  {act.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.instructions}</p>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                  <span>Jugar</span>
                  <Play className="w-4 h-4 fill-sky-500 text-sky-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
