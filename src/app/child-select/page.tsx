'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Baby, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IChild } from '@/types';

export default function ChildSelectPage() {
  const router = useRouter();
  const [children, setChildren] = useState<IChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/children')
      .then((res) => res.json())
      .then((data) => {
        if (data.children) {
          setChildren(data.children);
          // Si solo hay uno, redirigir automáticamente
          if (data.children.length === 1) {
            router.push(`/child/${data.children[0]._id}`);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-emerald-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
          <Baby className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Entrar a Modo Niño
        </h1>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Selecciona el perfil infantil para abrir el comunicador SAAC, la agenda y las actividades adaptadas.
        </p>

        {isLoading ? (
          <div className="py-8 text-slate-400">Cargando perfiles...</div>
        ) : children.length === 0 ? (
          <div className="py-6">
            <p className="text-slate-500 text-sm mb-4">No se encontraron perfiles infantiles.</p>
            <Link href="/tutor">
              <Button variant="primary" size="md">
                Ir a Crear Perfil
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <Link key={child._id} href={`/child/${child._id}`} className="block">
                <button className="w-full p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-600 flex items-center justify-between transition-all group">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                      {child.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-slate-800 group-hover:text-emerald-900 text-base">
                        {child.name}
                      </div>
                      {child.nickname && (
                        <div className="text-xs text-slate-500">"{child.nickname}"</div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al panel administrativo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
