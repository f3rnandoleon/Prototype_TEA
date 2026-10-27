'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  LogOut,
  Baby,
  Shield,
  Calendar,
  Clock,
  BookOpen,
  Activity,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/shared/BottomNav';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const allNavLinks = [
    { href: `/${currentRole}`, label: 'Mi Panel', icon: Shield, badgeColor: 'text-emerald-700' },
    { href: '/routines', label: 'Rutinas', icon: Clock, badgeColor: 'text-emerald-700' },
    { href: '/calendar', label: 'Calendario', icon: Calendar, badgeColor: 'text-rose-700' },
    { href: '/activities', label: 'Actividades', icon: BookOpen, badgeColor: 'text-indigo-700' },
    { href: '/tracking', label: 'Seguimiento', icon: Activity, badgeColor: 'text-sky-700' },
  ];

  // El profesional clínico no accede a actividades educativas (exclusivas para docentes y tutores)
  const navLinks = allNavLinks.filter(
    (link) => !(currentRole === 'professional' && link.href === '/activities')
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-2.5">
            <Link
              href={user ? `/${user.role}` : '/'}
              className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="font-extrabold text-base sm:text-xl text-slate-800 tracking-tight">
                Plataforma <span className="text-emerald-600 font-black">TEA</span>
              </span>
            </Link>
          </div>

          {/* Enlaces de Navegación del Panel Adulto (Desktop) */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Navegación principal">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.href === `/${currentRole}` ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? link.href === '/calendar'
                          ? 'bg-rose-50 text-rose-700 font-black'
                          : 'bg-emerald-50 text-emerald-700 font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Acciones de Usuario y Acceso a Modo Niño */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                {/* Botón destacado para ingresar al Entorno Infantil */}
                <Link href="/child-select">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
                  >
                    <Baby className="w-4 h-4" />
                    <span className="inline">Modo Niño</span>
                  </Button>
                </Link>

                {/* Información del usuario y rol (Desktop) */}
                <div className="hidden lg:flex flex-col items-end text-xs">
                  <span className="font-bold text-slate-800">{user.name}</span>
                  <Badge variant={roleLabels[currentRole].variant} className="mt-0.5">
                    {roleLabels[currentRole].label}
                  </Badge>
                </div>

                {/* Botón Salir (Desktop) */}
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="hidden md:flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* Botón Menú Móvil Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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

        {/* Menú Desplegable Móvil (Drawer) */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {/* Perfil del usuario */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <Badge variant={roleLabels[currentRole].variant}>
                {roleLabels[currentRole].label}
              </Badge>
            </div>

            {/* Lista completa de enlaces de navegación en móvil */}
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.href === `/${currentRole}` ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-rose-50 text-rose-800 shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-rose-200/70 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </nav>

            {/* Acciones de pie de menú */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/child-select"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5"
              >
                <Baby className="w-4 h-4" />
                <span>Cambiar de Niño / Entorno</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Barra de navegación inferior móvil para acceso rápido con 1 toque */}
      <BottomNav user={user} />
    </>
  );
};
