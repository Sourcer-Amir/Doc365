import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, User, MessageSquare, BotMessageSquare, Lightbulb, FileText, Shield, LogOut, Users, ArrowLeft, CalendarDays, UsersRound } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = '/';
  const showBackButton = location.pathname !== homePath;

  const patientLinks = [
    { path: homePath, icon: Home, label: 'Inicio' },
    { path: '/profile', icon: User, label: 'Mi Perfil' },
    { path: '/search-doctors', icon: Users, label: 'Buscar Doctores' },
    { path: '/chat-doctor', icon: MessageSquare, label: 'Mis Chats' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendario' },
    { path: '/chat-ai', icon: BotMessageSquare, label: 'Chat IA' },
    { path: '/recommendations', icon: Lightbulb, label: 'Recomendaciones' },
    { path: '/documents', icon: FileText, label: 'Documentos' },
    { path: '/privacy', icon: Shield, label: 'Privacidad' },
  ];

  const doctorLinks = [
    { path: homePath, icon: Home, label: 'Inicio' },
    { path: '/verification', icon: Shield, label: 'Verificación' },
    { path: '/chat-doctor', icon: MessageSquare, label: 'Mensajes' },
    { path: '/doctor-network', icon: UsersRound, label: 'Colegas' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendario' },
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
    <nav className="glassmorphic sticky top-4 rounded-full mx-4 mb-6 px-4 py-3 shadow-lg z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Volver</span>
            </Button>
          )}
          <button
            type="button"
            data-testid="nav-logo-button"
            aria-label="Ir al inicio"
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-primary/10 transition-colors"
          >
            <BrandLogo size={24} />
            <span className="font-heading font-bold text-lg">Sana</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}-button`}
                type="button"
                onClick={() => navigate(link.path)}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-full ${isActive ? '' : 'hover:bg-primary/10'}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">{link.label}</span>
              </Button>
            );
          })}
          
          <Button
            data-testid="logout-button"
            type="button"
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="rounded-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
