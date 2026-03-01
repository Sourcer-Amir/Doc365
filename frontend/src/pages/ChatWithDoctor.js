import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import { Send, Search, UserPlus, UserMinus, Video } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function ChatWithDoctor({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientIds, setPatientIds] = useState(new Set());
  const isPatient = user?.role === 'patient';

  const loadChatUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/doctor/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let threads = response.data || [];
      const incoming = isPatient ? location.state?.selectedDoctor : location.state?.selectedPatient;
      if (incoming && !threads.some((u) => u.id === incoming.id)) {
        threads = [incoming, ...threads];
      }
      setChatUsers(threads);
      if (incoming) {
        setSelectedUser(incoming);
      } else if (threads.length > 0) {
        setSelectedUser((prev) => prev || threads[0]);
      }
    } catch (error) {
      toast.error('Error al cargar chats');
    }
  }, [isPatient, location.state]);

  const loadDoctorPatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ids = new Set((response.data || []).map((p) => p.id));
      setPatientIds(ids);
    } catch (error) {
      console.error('Error loading doctor patients:', error);
    }
  }, []);

  useEffect(() => {
    loadChatUsers();
    if (!isPatient) {
      loadDoctorPatients();
    }
  }, [isPatient, loadChatUsers, loadDoctorPatients]);

  useEffect(() => {
    if (isPatient && location.state?.selectedDoctor) {
      const incoming = location.state.selectedDoctor;
      setSelectedUser(incoming);
      setChatUsers((prev) => {
        if (prev.some((u) => u.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    }
    if (!isPatient && location.state?.selectedPatient) {
      const incoming = location.state.selectedPatient;
      setSelectedUser(incoming);
      setChatUsers((prev) => {
        if (prev.some((u) => u.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    }
  }, [location.state, isPatient]);

  const togglePatient = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    const isMarked = patientIds.has(selectedUser.id);
    try {
      if (isMarked) {
        await axios.delete(`${API}/doctor/patients/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatientIds((prev) => {
          const next = new Set(prev);
          next.delete(selectedUser.id);
          return next;
        });
        toast.success('Paciente eliminado');
      } else {
        await axios.post(
          `${API}/doctor/patients/${selectedUser.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPatientIds((prev) => new Set(prev).add(selectedUser.id));
        toast.success('Paciente agregado');
      }
    } catch (error) {
      toast.error('No se pudo actualizar el paciente');
    }
  };

  const loadMessages = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/doctor`, {
        params: { other_user_id: selectedUser.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat`,
        {
          content: newMessage,
          recipient_id: selectedUser.id,
          chat_type: 'doctor'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([...messages, response.data]);
      setNewMessage('');
      toast.success('Mensaje enviado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  const openVideoCall = () => {
    if (!selectedUser) return;
    navigate('/video-call', { state: { callPeer: selectedUser } });
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            {isPatient ? 'Mis Chats' : 'Mensajes'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPatient ? 'Consulta con especialistas' : 'Mensajes de pacientes'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card data-testid="doctors-list-card" className="lg:col-span-1 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-heading">
                {isPatient ? 'Mis Médicos' : 'Pacientes'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {chatUsers.map((chatUser, idx) => (
                  <button
                    key={chatUser.id}
                    data-testid={`doctor-item-${idx}`}
                    onClick={() => setSelectedUser(chatUser)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border ${
                      selectedUser?.id === chatUser.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {chatUser.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{chatUser.full_name}</p>
                      <p className="text-xs text-muted-foreground">{chatUser.specialty || 'Paciente'}</p>
                      {!isPatient && patientIds.has(chatUser.id) && (
                        <Badge variant="secondary" className="mt-2 rounded-full">Mi paciente</Badge>
                      )}
                    </div>
                  </button>
                ))}
                {chatUsers.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    {isPatient ? 'Aún no tienes chats' : 'No tienes mensajes'}
                    {isPatient && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => navigate('/search-doctors')}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Buscar doctores
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card data-testid="chat-area-card" className="lg:col-span-3 border-border/50 shadow-lg">
            <CardHeader>
              {selectedUser ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedUser.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedUser.full_name}</CardTitle>
                      <CardDescription>{selectedUser.specialty || 'Paciente'}</CardDescription>
                    </div>
                  </div>
                  {!isPatient && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={openVideoCall}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Videollamada
                      </Button>
                      <Button
                        variant={patientIds.has(selectedUser.id) ? 'outline' : 'default'}
                        className="rounded-full"
                        onClick={togglePatient}
                      >
                        {patientIds.has(selectedUser.id) ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Eliminar paciente
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Marcar como paciente
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {isPatient && (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={openVideoCall}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Videollamada
                    </Button>
                  )}
                </div>
              ) : (
                <CardTitle className="text-lg">
                  {isPatient ? 'Selecciona un médico' : 'Selecciona un paciente'}
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] mb-4 pr-4">
                <div data-testid="messages-container" className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        data-testid={`message-${idx}`}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary border border-border'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && selectedUser && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No hay mensajes aún</p>
                      <p className="text-sm mt-2">Inicia la conversación con {selectedUser.full_name}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {selectedUser && (
                <div className="flex gap-2">
                  <Input
                    data-testid="message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="Escribe tu mensaje..."
                    className="rounded-full"
                    disabled={loading}
                  />
                  <Button
                    data-testid="send-message-button"
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="rounded-full"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
