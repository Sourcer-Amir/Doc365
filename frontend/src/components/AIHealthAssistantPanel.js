import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Bot,
  Lightbulb,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://sanarios-backend-api.onrender.com';
const API = `${BACKEND_URL}/api`;

function parseAiMeta(text) {
  const lines = (text || '').split('\n');
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
        doctors = raw.split(';').map((doctor) => doctor.trim()).filter(Boolean);
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
}

export default function AIHealthAssistantPanel({ compact = false }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiConsent, setAiConsent] = useState(null);

  const visibleRecommendations = useMemo(
    () => recommendations.slice(0, compact ? 3 : 5),
    [compact, recommendations]
  );

  useEffect(() => {
    loadAiConsent();
  }, []);

  useEffect(() => {
    if (aiConsent) {
      loadMessages();
      loadRecommendations();
    }
  }, [aiConsent]);

  const loadAiConsent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/ai/consent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiConsent(Boolean(response.data.ai_consent));
    } catch (error) {
      console.error('Error loading AI consent:', error);
      setAiConsent(false);
    }
  };

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/ai`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendations(response.data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
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
      const nextRecommendations = [...(response.data || []), ...recommendations];
      setRecommendations(nextRecommendations);
      toast.success('Se actualizaron tus recomendaciones');
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error('Debes aceptar el consentimiento para usar IA');
        setAiConsent(false);
      } else {
        toast.error('No se pudieron generar recomendaciones');
      }
    } finally {
      setGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    const userText = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat`,
        {
          content: userText,
          chat_type: 'ai',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, response.data.user_message, response.data.ai_response]);
      loadRecommendations();
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error('Debes aceptar el consentimiento para usar IA');
        setAiConsent(false);
      } else {
        toast.error('Error al enviar mensaje');
      }
      setNewMessage(userText);
    } finally {
      setSending(false);
    }
  };

  if (aiConsent === false) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Asistente IA bloqueado</CardTitle>
              <CardDescription>
                Activa el consentimiento en Privacidad para usar IA y generar recomendaciones.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="rounded-full" onClick={() => navigate('/privacy')}>
            Ir a Privacidad
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-heading">Asistente IA + recomendaciones</CardTitle>
              <CardDescription>
                Conversa con la IA y aterriza tus siguientes pasos desde el mismo panel.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate('/recommendations')}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Historial
            </Button>
            <Button
              className="rounded-full"
              onClick={generateRecommendations}
              disabled={generating || aiConsent === false}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', generating && 'animate-spin')} />
              {generating ? 'Actualizando...' : 'Actualizar recomendaciones'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)]">
          <div className="border-b border-border xl:border-b-0 xl:border-r">
            <ScrollArea className={compact ? 'h-[420px]' : 'h-[560px]'}>
              <div className="space-y-6 p-5">
                {loadingMessages ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Cargando conversación...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-secondary/20 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-heading font-semibold">Empieza tu consulta</h3>
                    <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                      La IA puede orientarte sobre síntomas, hábitos, medicamentos y darte contexto
                      adicional sobre las recomendaciones que ya tienes.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isAI = message.is_ai || message.sender_id === 'ai';
                    const parsed = isAI ? parseAiMeta(message.content) : null;

                    return (
                      <div
                        key={message.id || `message-${index}`}
                        className={cn('flex gap-3', !isAI && 'justify-end')}
                      >
                        {isAI && (
                          <Avatar className="mt-1">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={cn('max-w-[78%]', !isAI && 'flex flex-col items-end')}>
                          <div
                            className={cn(
                              'rounded-3xl p-4',
                              isAI
                                ? 'border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10'
                                : 'bg-primary text-primary-foreground'
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm">
                              {isAI ? parsed.cleanText : message.content}
                            </p>

                            {isAI && parsed.specialty && (
                              <Badge variant="secondary" className="mt-3 rounded-full">
                                Especialidad sugerida: {parsed.specialty}
                              </Badge>
                            )}

                            {isAI && parsed.doctors.length > 0 && (
                              <div className="mt-3 rounded-2xl border border-border bg-background/70 p-3">
                                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                  Doctores recomendados
                                </p>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  {parsed.doctors.map((doctor, doctorIndex) => (
                                    <p key={`${message.id || index}-doctor-${doctorIndex}`}>• {doctor}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <p className="mt-1 px-1 text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {!isAI && (
                          <Avatar className="mt-1">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}

                {sending && (
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !sending) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Pregunta algo sobre tu salud o sobre una recomendación..."
                  className="rounded-full"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                La IA orienta, pero no sustituye diagnóstico ni tratamiento médico.
              </p>
            </div>
          </div>

          <div className="bg-secondary/10">
            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold">Recomendaciones activas</p>
                <p className="text-xs text-muted-foreground">
                  Usa estas recomendaciones como contexto para continuar la conversación.
                </p>
              </div>

              {visibleRecommendations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Todavía no tienes recomendaciones guardadas. Genera unas nuevas desde aquí.
                </div>
              ) : (
                visibleRecommendations.map((recommendation, index) => {
                  const parsed = parseAiMeta(recommendation.content || '');
                  return (
                    <div
                      key={recommendation.id || `recommendation-${index}`}
                      className="rounded-2xl border border-border bg-background/85 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="font-semibold leading-tight">{recommendation.title}</p>
                        {recommendation.category && (
                          <Badge variant="secondary" className="rounded-full">
                            {recommendation.category}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {(parsed.cleanText || recommendation.content || '').slice(0, compact ? 110 : 150)}
                        {(parsed.cleanText || recommendation.content || '').length > (compact ? 110 : 150) ? '...' : ''}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {parsed.specialty && (
                          <Badge variant="outline" className="rounded-full">
                            {parsed.specialty}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() =>
                            setNewMessage(`Explícame mejor esta recomendación y cómo aplicarla: ${recommendation.title}`)
                          }
                        >
                          Usar en chat
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
