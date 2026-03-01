import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Lightbulb, RefreshCw, TrendingUp, Heart, Activity, Pill, Apple, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const categoryIcons = {
  'Nutrición': Apple,
  'Ejercicio': Activity,
  'Bienestar': Heart,
  'Prevención': TrendingUp,
  'Medicación': Pill,
};

const categoryColors = {
  'Nutrición': 'bg-green-100 text-green-700 border-green-200',
  'Ejercicio': 'bg-blue-100 text-blue-700 border-blue-200',
  'Bienestar': 'bg-pink-100 text-pink-700 border-pink-200',
  'Prevención': 'bg-purple-100 text-purple-700 border-purple-200',
  'Medicación': 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function Recommendations({ user, onLogout }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiConsent, setAiConsent] = useState(null);

  useEffect(() => {
    loadRecommendations();
    loadAiConsent();
  }, []);

  const loadAiConsent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/ai/consent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiConsent(Boolean(response.data.ai_consent));
    } catch (error) {
      console.error('Error loading AI consent:', error);
      setAiConsent(false);
    }
  };

  const parseRecMeta = (text) => {
    const lines = text.split('\n');
    let specialty = null;
    let doctors = [];
    const cleanLines = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('especialidad sugerida:')) {
        specialty = trimmed.split(':').slice(1).join(':').trim();
        return;
      }
      if (trimmed.toLowerCase().startsWith('doctores recomendados:')) {
        const raw = trimmed.split(':').slice(1).join(':').trim();
        if (raw && raw.toLowerCase() !== 'ninguno') {
          doctors = raw.split(';').map((d) => d.trim()).filter(Boolean);
        }
        return;
      }
      cleanLines.push(line);
    });

    return {
      cleanText: cleanLines.join('\n').trim(),
      specialty: specialty && specialty.toLowerCase() !== 'ninguno' ? specialty : null,
      doctors,
    };
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/recommendations/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecommendations([...response.data, ...recommendations]);
      toast.success('Recomendaciones generadas exitosamente');
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error('Debes aceptar el consentimiento para usar IA');
        setAiConsent(false);
      } else {
        toast.error('Error al generar recomendaciones');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
              Recomendaciones de Salud
            </h1>
            <p className="text-muted-foreground text-lg">Consejos personalizados para tu bienestar</p>
          </div>
          <Button
            data-testid="generate-recommendations-button"
            onClick={generateRecommendations}
            disabled={generating || aiConsent === false}
            className="rounded-full"
            size="lg"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generando...' : 'Generar Nuevas'}
          </Button>
        </div>

        {aiConsent === false ? (
          <Card data-testid="ai-consent-required-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Consentimiento requerido</CardTitle>
                  <CardDescription>
                    Para generar recomendaciones con IA debes aceptar el consentimiento en Privacidad.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/privacy')} className="rounded-full">
                Ir a Privacidad
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando recomendaciones...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <Card data-testid="empty-recommendations-card" className="border-border/50 shadow-lg">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">Sin recomendaciones aún</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Genera recomendaciones personalizadas basadas en tu perfil médico y historial de salud
                </p>
                <Button
                  data-testid="empty-generate-button"
                  onClick={generateRecommendations}
                  disabled={generating || aiConsent === false}
                  className="rounded-full"
                  size="lg"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {generating ? 'Generando...' : 'Generar Recomendaciones'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => {
              const Icon = categoryIcons[rec.category] || Lightbulb;
              const colorClass = categoryColors[rec.category] || 'bg-gray-100 text-gray-700 border-gray-200';
              const parsed = parseRecMeta(rec.content || '');
              
              return (
                <Card key={rec.id} data-testid={`recommendation-card-${idx}`} className="hover-lift border-border/50 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full ${colorClass} border flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          {rec.category}
                        </Badge>
                        {parsed.specialty && (
                          <Badge variant="outline" className="rounded-full">
                            {parsed.specialty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-heading">{rec.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(rec.timestamp).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {parsed.cleanText || rec.content}
                    </p>
                    {parsed.doctors.length > 0 && (
                      <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">
                          Doctores recomendados
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {parsed.doctors.map((doc, dIdx) => (
                            <li key={`${rec.id}-doc-${dIdx}`}>• {doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
