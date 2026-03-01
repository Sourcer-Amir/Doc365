import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '@/components/Navigation';
import AIHealthAssistantPanel from '@/components/AIHealthAssistantPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  CalendarRange,
  FileText,
  HeartPulse,
  Pill,
  Search,
  TrendingUp,
  UserRound,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://sanarios-backend-api.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function PatientDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommendationsCount, setRecommendationsCount] = useState(0);

  useEffect(() => {
    loadProfile();
    loadRecommendations();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendationsCount((response.data || []).length);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}
    >
      <Navigation user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading font-bold text-foreground md:text-5xl">
            Bienvenido, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-lg text-muted-foreground">
            Tu resumen de salud y tus herramientas principales están concentrados aquí.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HeartPulse className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Estado de Salud</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold text-primary">Bueno</p>
              <p className="mt-1 text-sm text-muted-foreground">Última actualización hoy</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Pill className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Medicamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold">
                {profile?.current_medications?.length || 0}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Actuales</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <TrendingUp className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold">{recommendationsCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Disponibles para revisar con IA</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold">85%</p>
              <p className="mt-1 text-sm text-muted-foreground">Seguimiento semanal</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Acciones rápidas</CardTitle>
              <CardDescription>
                Todo lo importante sin cambiar de pestaña innecesariamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/search-doctors')}
                className="h-12 w-full justify-start rounded-full"
                variant="outline"
              >
                <Search className="mr-3 h-5 w-5" />
                Buscar y contactar médico
              </Button>
              <Button
                onClick={() => navigate('/consultations')}
                className="h-12 w-full justify-start rounded-full"
                variant="outline"
              >
                <CalendarRange className="mr-3 h-5 w-5" />
                Ver tus consultas
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                className="h-12 w-full justify-start rounded-full"
                variant="outline"
              >
                <UserRound className="mr-3 h-5 w-5" />
                Actualizar perfil médico
              </Button>
              <Button
                onClick={() => navigate('/documents')}
                className="h-12 w-full justify-start rounded-full"
                variant="outline"
              >
                <FileText className="mr-3 h-5 w-5" />
                Gestionar documentos
              </Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2">
            <AIHealthAssistantPanel compact />
          </div>
        </div>

        {profile && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Resumen de salud</CardTitle>
              <CardDescription>Tu información médica clave en una sola vista.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo de sangre
                  </h4>
                  <p className="text-lg font-medium">{profile.blood_type || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Alergias
                  </h4>
                  <p className="text-lg font-medium">
                    {profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'Ninguna'}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Condiciones
                  </h4>
                  <p className="text-lg font-medium">
                    {profile.chronic_conditions?.length > 0
                      ? profile.chronic_conditions.join(', ')
                      : 'Ninguna'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
