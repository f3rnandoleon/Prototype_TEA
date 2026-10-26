import React from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, Calendar, BookOpen, Heart, Shield, Users, ArrowRight, Baby } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-sky-50 flex flex-col">
      {/* Barra superior de navegación */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">
              Plataforma <span className="text-emerald-600">TEA</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="font-bold shadow-sm">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold tracking-wide uppercase mb-6 border border-emerald-200">
            <span>Neurodiversidad • Autonomía • Comunicación</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Apoyo Integral, Respetuoso y Accesible para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">
              Niños Autistas
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Un entorno digital seguro donde convergen el comunicador SAAC, agendas visuales predecibles, actividades
            educativas individualizadas y espacios de calma, conectando con respeto a familias, docentes y profesionales.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base font-extrabold px-8 py-4 shadow-lg shadow-emerald-600/20 gap-2"
              >
                <span>Acceder a la Plataforma</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/child-select" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-base font-extrabold px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg shadow-sky-600/20 gap-2"
              >
                <Baby className="w-5 h-5" />
                <span>Explorar Modo Niño</span>
              </Button>
            </Link>
          </div>

          {/* Tarjetas de Módulos Clave */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">Comunicador SAAC</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Tableros visuales con síntesis de voz en español, frases limpias, categorías claras y resiliencia offline.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">Rutinas y "Mi Día"</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Agenda visual interactiva, anticipación de cambios imprevistos sin alertas abrumadoras y marcado paso a paso.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">Actividades Adaptadas</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Asociación visual, selección y ordenamiento de secuencias con retroalimentación amable sin penalizaciones.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">Zona de Calma</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Espacio de baja estimulación sensorial con sonidos relajantes opcionales, botón de silencio y libre salida.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">Plataforma Integral de Apoyo para Niños Autistas</p>
          <p className="mt-1">
            Diseñada bajo principios de neurodiversidad, privacidad de datos y accesibilidad WCAG 2.2 AA.
          </p>
        </div>
      </footer>
    </div>
  );
}
