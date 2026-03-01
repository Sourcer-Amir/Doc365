import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Home,
  LogOut,
  Shield,
  User,
  Users,
  UsersRound,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';

export default function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = '/';
  const showBackButton = location.pathname !== homePath;

  const patientLinks = [
    { path: homePath, icon: Home, label: 'Inicio' },
    { path: '/profile', icon: User, label: 'Mi Perfil' },
    { path: '/search-doctors', icon: Users, label: 'Buscar Doctores' },
    { path: '/consultations', icon: CalendarDays, label: 'Tus Consultas' },
    { path: '/documents', icon: FileText, label: 'Documentos' },
    { path: '/privacy', icon: Shield, label: 'Privacidad' },
  ];

  const doctorLinks = [
    { path: homePath, icon: Home, label: 'Inicio' },
    { path: '/verification', icon: Shield, label: 'Verificación' },
    { path: '/consultations', icon: CalendarDays, label: 'Consultas' },
    { path: '/doctor-network', icon: UsersRound, label: 'Colegas' },
  ];

  const links = user.role === 'patient' ? patientLinks : doctorLinks;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(homePath);
  };

  return (
    <nav className="glassmorphic sticky top-4 z-50 mx-4 mb-6 rounded-[2rem] px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:grid lg:grid-cols-[minmax(220px,1fr)_auto_minmax(140px,1fr)] lg:items-center">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              type="button"
              data-testid="nav-back-button"
              aria-label="Volver"
              onClick={handleGoBack}
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-2 hidden md:inline">Volver</span>
            </Button>
          )}

          <button
            type="button"
            data-testid="nav-logo-button"
            aria-label="Ir al inicio"
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-primary/10"
          >
            <BrandLogo size={24} />
            <span className="font-heading text-lg font-bold">Sana</span>
          </button>
        </div>

        <div className="flex justify-center">
          <div className="flex max-w-full items-center justify-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                ((link.path === homePath &&
                  (location.pathname === homePath ||
                    location.pathname === '/chat-ai' ||
                    location.pathname === '/recommendations')) ||
                  location.pathname === link.path) ||
                (link.path === '/consultations' &&
                  (location.pathname === '/calendar' || location.pathname === '/chat-doctor'));

              return (
                <Button
                  key={link.path}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}-button`}
                  type="button"
                  onClick={() => navigate(link.path)}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="shrink-0 rounded-full px-4"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{link.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            data-testid="logout-button"
            type="button"
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="rounded-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Salir</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
