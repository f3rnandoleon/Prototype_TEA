'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Calendar, Clock, BookOpen, Activity } from 'lucide-react';

interface BottomNavProps {
  user?: {
    name: string;
    email: string;
    role: 'tutor' | 'professional' | 'teacher';
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({ user }) => {
  const pathname = usePathname();

  if (!user) return null;

  const homePath = `/${user.role}`;

  const navItems = [
    {
      label: 'Panel',
      href: homePath,
      icon: Shield,
      activeColor: 'text-emerald-700 bg-emerald-50/90',
      isActive: pathname === homePath,
    },
    {
      label: 'Rutinas',
      href: '/routines',
      icon: Clock,
      activeColor: 'text-emerald-700 bg-emerald-50/90',
      isActive: pathname.startsWith('/routines'),
    },
    {
      label: 'Calendario',
      href: '/calendar',
      icon: Calendar,
      activeColor: 'text-rose-700 bg-rose-50/90',
      isActive: pathname.startsWith('/calendar'),
    },
    {
      label: 'Seguimiento',
      href: '/tracking',
      icon: Activity,
      activeColor: 'text-sky-700 bg-sky-50/90',
      isActive: pathname.startsWith('/tracking'),
    },
    {
      label: 'Actividades',
      href: '/activities',
      icon: BookOpen,
      activeColor: 'text-indigo-700 bg-indigo-50/90',
      isActive: pathname.startsWith('/activities'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around"
      aria-label="Navegación móvil inferior"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
              item.isActive ? item.activeColor : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              {item.isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                item.isActive ? 'font-black' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
