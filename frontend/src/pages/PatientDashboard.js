import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartPulse, Pill, Calendar, Activity, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function PatientDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadRecommendations();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Bienvenido, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-lg">Aquí está tu resumen de salud</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="health-status-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <HeartPulse className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Estado de Salud</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading text-primary">Bueno</p>
              <p className="text-sm text-muted-foreground mt-1">Última actualización hoy</p>
            </CardContent>
          </Card>

          <Card data-testid="medications-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Pill className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Medicamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">{profile?.current_medications?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Actuales</p>
            </CardContent>
          </Card>

          <Card data-testid="recommendations-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">{recommendations.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Nuevas</p>
            </CardContent>
          </Card>

          <Card data-testid="activity-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">85%</p>
              <p className="text-sm text-muted-foreground mt-1">Nivel de actividad</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="quick-actions-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Acciones Rápidas</CardTitle>
              <CardDescription>Accede a tus herramientas principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                data-testid="action-chat-ai-button"
                onClick={() => navigate('/chat-ai')} 
                className="w-full rounded-full justify-start h-12" 
                variant="outline"
              >
                <BotMessageSquare className="w-5 h-5 mr-3" />
                Consultar Asistente IA
              </Button>
              <Button 
                data-testid="action-chat-doctor-button"
                onClick={() => navigate('/search-doctors')} 
                className="w-full rounded-full justify-start h-12" 
                variant="outline"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Buscar y contactar médico
              </Button>
              <Button 
                data-testid="action-profile-button"
                onClick={() => navigate('/profile')} 
                className="w-full rounded-full justify-start h-12" 
                variant="outline"
              >
                <User className="w-5 h-5 mr-3" />
                Actualizar Perfil Médico
              </Button>
              <Button 
                data-testid="action-documents-button"
                onClick={() => navigate('/documents')} 
                className="w-full rounded-full justify-start h-12" 
                variant="outline"
              >
                <FileText className="w-5 h-5 mr-3" />
                Subir Documentos
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="recent-recommendations-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Recomendaciones Recientes</CardTitle>
              <CardDescription>Consejos personalizados para tu salud</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aún no tienes recomendaciones</p>
                  <Button 
                    data-testid="generate-recommendations-button"
                    onClick={() => navigate('/recommendations')} 
                    className="rounded-full"
                  >
                    Generar Recomendaciones
                  </Button>
                </div>
              ) : (
                <>
                  {recommendations.map((rec, idx) => (
                    <div key={rec.id} data-testid={`recommendation-item-${idx}`} className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <h4 className="font-semibold font-heading mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{rec.content}</p>
                    </div>
                  ))}
                  <Button 
                    data-testid="view-all-recommendations-button"
                    onClick={() => navigate('/recommendations')} 
                    variant="link" 
                    className="w-full"
                  >
                    Ver todas las recomendaciones →
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {profile && (
          <Card data-testid="health-summary-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Resumen de Salud</CardTitle>
              <CardDescription>Tu información médica clave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold font-heading text-sm text-muted-foreground uppercase tracking-wider mb-2">Tipo de Sangre</h4>
                  <p className="text-lg font-medium">{profile.blood_type || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="font-semibold font-heading text-sm text-muted-foreground uppercase tracking-wider mb-2">Alergias</h4>
                  <p className="text-lg font-medium">{profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'Ninguna'}</p>
                </div>
                <div>
                  <h4 className="font-semibold font-heading text-sm text-muted-foreground uppercase tracking-wider mb-2">Condiciones</h4>
                  <p className="text-lg font-medium">{profile.chronic_conditions?.length > 0 ? profile.chronic_conditions.join(', ') : 'Ninguna'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { BotMessageSquare, MessageSquare, User, Lightbulb } from 'lucide-react';
