'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, LogOut, Baby, Shield, Calendar, BookOpen, Activity, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: 'tutor' | 'professional' | 'teacher';
    specialty?: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  const roleLabels = {
    tutor: { label: 'Tutor Legal', variant: 'success' as const },
    professional: { label: `Profesional ${user?.specialty ? `(${user.specialty})` : ''}`, variant: 'info' as const },
    teacher: { label: 'Docente', variant: 'warning' as const },
  };

  const currentRole = user?.role || 'tutor';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo y Nombre */}
        <div className="flex items-center space-x-3">
          <Link
            href={user ? `/${user.role}` : '/'}
            className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
              Plataforma <span className="text-emerald-600 font-black">TEA</span>
            </span>
          </Link>
        </div>

        {/* Enlaces de Navegación del Panel Adulto */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Navegación principal">
            <Link
              href={`/${user.role}`}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === `/${user.role}`
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Mi Panel</span>
            </Link>

            <Link
              href="/routines"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/routines')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Rutinas</span>
            </Link>

            <Link
              href="/activities"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/activities')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Actividades</span>
            </Link>

            <Link
              href="/tracking"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/tracking')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Seguimiento</span>
            </Link>
          </nav>
        )}

        {/* Acciones de Usuario y Acceso a Modo Niño */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Botón destacado para ingresar al Entorno Infantil */}
              <Link href="/child-select">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md gap-1.5"
                >
                  <Baby className="w-4 h-4" />
                  <span className="hidden sm:inline">Modo Niño</span>
                </Button>
              </Link>

              {/* Información del usuario y rol */}
              <div className="hidden lg:flex flex-col items-end text-xs">
                <span className="font-bold text-slate-800">{user.name}</span>
                <Badge variant={roleLabels[currentRole].variant} className="mt-0.5">
                  {roleLabels[currentRole].label}
                </Badge>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
