import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Send, Bot, User, Sparkles, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function ChatWithAI({ user, onLogout }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConsent, setAiConsent] = useState(null);

  useEffect(() => {
    loadAiConsent();
  }, []);

  useEffect(() => {
    if (aiConsent) {
      loadMessages();
    }
  }, [aiConsent]);

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

  const parseAiMeta = (text) => {
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

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/ai`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMsg = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat`,
        {
          content: userMsg,
          chat_type: 'ai'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([...messages, response.data.user_message, response.data.ai_response]);
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error('Debes aceptar el consentimiento para usar IA');
        setAiConsent(false);
      } else {
        toast.error('Error al enviar mensaje');
      }
      setNewMessage(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
              Asistente IA Médico
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Tu asistente personal de salud con inteligencia artificial</p>
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
                    Para usar la IA necesitas aceptar el consentimiento en Privacidad.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/privacy')}
                className="rounded-full"
              >
                Ir a Privacidad
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card data-testid="ai-chat-card" className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Asistente IA</CardTitle>
                <CardDescription>Disponible 24/7 para tus consultas de salud</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-6">
              <div data-testid="ai-messages-container" className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold mb-2">Bienvenido al Asistente IA</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Puedo ayudarte con consejos de salud, responder preguntas sobre tus medicamentos, 
                      y proporcionar recomendaciones personalizadas basadas en tu perfil médico.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isAI = msg.is_ai || msg.sender_id === 'ai';
                  const parsed = isAI ? parseAiMeta(msg.content) : null;
                  return (
                    <div
                      key={msg.id}
                      data-testid={`ai-message-${idx}`}
                      className={`flex gap-3 ${isAI ? '' : 'justify-end'}`}
                    >
                      {isAI && (
                        <Avatar className="mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${isAI ? '' : 'flex flex-col items-end'}`}>
                        <div
                          className={`p-4 rounded-2xl ${
                            isAI
                              ? 'bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {isAI ? parsed.cleanText : msg.content}
                          </p>
                          {isAI && parsed.specialty && (
                            <div className="mt-3">
                              <Badge variant="secondary" className="rounded-full">
                                Especialidad sugerida: {parsed.specialty}
                              </Badge>
                            </div>
                          )}
                          {isAI && parsed.doctors.length > 0 && (
                            <div className="mt-3 rounded-xl border border-border bg-background/50 p-3">
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                                Doctores recomendados
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {parsed.doctors.map((doc, dIdx) => (
                                  <li key={`${msg.id}-doc-${dIdx}`}>• {doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!isAI && (
                        <Avatar className="mt-1">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  data-testid="ai-message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Pregunta algo sobre tu salud..."
                  className="rounded-full"
                  disabled={loading}
                />
                <Button
                  data-testid="ai-send-button"
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                El asistente IA proporciona información general. Consulta a un médico para diagnósticos específicos.
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
