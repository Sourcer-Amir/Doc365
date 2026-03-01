import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addConsultation, loadConsultations } from '@/lib/consultations';
import {
  CalendarDays,
  Clock3,
  MessageSquare,
  PlusCircle,
  Search,
  Stethoscope,
  Video,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDateLabel(date) {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sortByDate(items) {
  return [...items].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
  );
}

export default function AppointmentsCalendar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPatient = user?.role === 'patient';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    participantId: '',
    date: formatDateInput(new Date()),
    time: '09:00',
    mode: 'Videollamada',
    notes: '',
  });

  useEffect(() => {
    setConsultations(loadConsultations(user?.id));
  }, [user?.id]);

  const loadChatUsers = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/doctor/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let threads = response.data || [];
      const incoming = isPatient ? location.state?.selectedDoctor : location.state?.selectedPatient;
      if (incoming && !threads.some((entry) => entry.id === incoming.id)) {
        threads = [incoming, ...threads];
      }

      setChatUsers(threads);

      if (incoming) {
        setSelectedUser(incoming);
      } else if (threads.length > 0) {
        setSelectedUser((prev) => prev || threads[0]);
      }
    } catch (error) {
      toast.error('No se pudieron cargar tus chats');
      setChatUsers([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [isPatient, location.state]);

  useEffect(() => {
    loadChatUsers();
  }, [loadChatUsers]);

  useEffect(() => {
    if (selectedUser && !chatUsers.some((entry) => entry.id === selectedUser.id)) {
      setSelectedUser(null);
    }
  }, [chatUsers, selectedUser]);

  useEffect(() => {
    if (!selectedUser && chatUsers.length > 0) {
      setSelectedUser(chatUsers[0]);
    }
  }, [chatUsers, selectedUser]);

  useEffect(() => {
    if (selectedUser && selectedUser.id !== form.participantId) {
      setForm((prev) => ({ ...prev, participantId: selectedUser.id }));
    }
  }, [form.participantId, selectedUser]);

  const consultationDates = useMemo(
    () => consultations.map((entry) => new Date(entry.scheduledAt)),
    [consultations]
  );

  const selectedDayConsultations = useMemo(() => {
    const filtered = consultations.filter((entry) =>
      isSameDay(new Date(entry.scheduledAt), selectedDate)
    );
    return sortByDate(
      selectedUser
        ? filtered.filter((entry) => entry.participantId === selectedUser.id)
        : filtered
    );
  }, [consultations, selectedDate, selectedUser]);

  const upcomingConsultations = useMemo(() => {
    const now = Date.now();
    const filtered = consultations.filter(
      (entry) => new Date(entry.scheduledAt).getTime() >= now - 60 * 1000
    );
    return sortByDate(
      selectedUser
        ? filtered.filter((entry) => entry.participantId === selectedUser.id)
        : filtered
    ).slice(0, 4);
  }, [consultations, selectedUser]);

  const createNewConsultation = () => {
    if (!form.participantId || !form.date || !form.time) {
      toast.error('Selecciona chat, fecha y hora');
      return;
    }

    const participant = chatUsers.find((entry) => entry.id === form.participantId);
    if (!participant) {
      toast.error('Selecciona un contacto válido');
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('Fecha u hora inválida');
      return;
    }

    setCreating(true);

    const nextConsultations = addConsultation(user?.id, {
      participantId: participant.id,
      participantName: participant.full_name,
      specialty: participant.specialty || '',
      mode: form.mode,
      scheduledAt: scheduledAt.toISOString(),
      notes: form.notes.trim(),
    });

    setConsultations(nextConsultations);
    setSelectedDate(scheduledAt);
    setMonth(new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), 1));
    setForm((prev) => ({
      ...prev,
      date: formatDateInput(scheduledAt),
      notes: '',
    }));
    setCreating(false);
    toast.success('Consulta programada en tu agenda');
  };

  const openChat = (chatUser) => {
    if (!chatUser) {
      return;
    }

    navigate('/chat-doctor', {
      state: isPatient ? { selectedDoctor: chatUser } : { selectedPatient: chatUser },
    });
  };

  const openVideoCall = (chatUser) => {
    if (!chatUser) {
      return;
    }

    navigate('/video-call', { state: { callPeer: chatUser } });
  };

  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}
    >
      <Navigation user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-heading font-bold text-foreground md:text-5xl">
              {isPatient ? 'Tus consultas' : 'Centro de consultas'}
            </h1>
            <p className="text-lg text-muted-foreground">
              Chats activos, agenda y videollamadas en un mismo espacio.
            </p>
          </div>

          <Badge className="rounded-full px-3 py-1.5">
            <CalendarDays className="mr-2 h-4 w-4" />
            {upcomingConsultations.length} próximas
          </Badge>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-4">
          <Card className="border-border/50 shadow-lg xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Chats activos</CardTitle>
              <CardDescription>
                Selecciona una conversación para ver su agenda y continuarla.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                {loadingThreads ? (
                  <div className="p-4 text-sm text-muted-foreground">Cargando chats...</div>
                ) : chatUsers.length === 0 ? (
                  <div className="p-4">
                    <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {isPatient
                        ? 'Todavía no tienes consultas abiertas con médicos.'
                        : 'Todavía no tienes conversaciones activas.'}
                    </div>

                    {isPatient && (
                      <Button
                        variant="outline"
                        className="mt-4 w-full rounded-full"
                        onClick={() => navigate('/search-doctors')}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Buscar doctores
                      </Button>
                    )}
                  </div>
                ) : (
                  chatUsers.map((chatUser) => {
                    const isActive = selectedUser?.id === chatUser.id;
                    const userConsultationCount = consultations.filter(
                      (entry) => entry.participantId === chatUser.id
                    ).length;

                    return (
                      <button
                        key={chatUser.id}
                        type="button"
                        onClick={() => setSelectedUser(chatUser)}
                        className={`w-full border-b border-border p-4 text-left transition-colors hover:bg-secondary/40 ${
                          isActive ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{chatUser.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {chatUser.specialty || (isPatient ? 'Profesional de salud' : 'Paciente')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {userConsultationCount}
                          </Badge>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Calendario</CardTitle>
              <CardDescription>
                Marca tus citas y entra a videollamada desde el día correspondiente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-border bg-background p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={month}
                  onMonthChange={setMonth}
                  modifiers={{ hasConsultation: consultationDates }}
                  modifiersClassNames={{
                    hasConsultation:
                      'font-semibold after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary',
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">Día seleccionado</p>
                  <p className="mt-1 capitalize text-sm text-muted-foreground">
                    {formatDateLabel(selectedDate)}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {selectedDayConsultations.length === 0
                      ? 'No hay consultas para esta fecha.'
                      : `${selectedDayConsultations.length} consulta(s) programada(s).`}
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">Siguiente paso</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedUser
                      ? `Continúa con ${selectedUser.full_name} o agenda una nueva consulta.`
                      : 'Selecciona un chat para ligar la agenda con una conversación.'}
                  </p>
                  {selectedUser && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => openChat(selectedUser)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Abrir chat
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => openVideoCall(selectedUser)}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Videollamada
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 xl:col-span-1">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Agenda del día</CardTitle>
                <CardDescription className="capitalize">
                  {formatDateLabel(selectedDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayConsultations.length === 0 ? (
                  <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                    No tienes citas registradas para esta fecha.
                  </div>
                ) : (
                  selectedDayConsultations.map((entry) => {
                    const entryDate = new Date(entry.scheduledAt);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-border bg-secondary/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{entry.participantName}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.specialty || (isPatient ? 'Consulta médica' : 'Seguimiento')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {entry.mode}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            {entryDate.toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="flex items-center gap-2">
                            {entry.mode === 'Videollamada' ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <Stethoscope className="h-4 w-4" />
                            )}
                            {entry.notes || 'Sin notas adicionales'}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() =>
                              openChat(
                                chatUsers.find((chatUser) => chatUser.id === entry.participantId) || selectedUser
                              )
                            }
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                          {entry.mode === 'Videollamada' && (
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() =>
                                openVideoCall(
                                  chatUsers.find((chatUser) => chatUser.id === entry.participantId) || selectedUser
                                )
                              }
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Entrar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Programar consulta</CardTitle>
                <CardDescription>
                  Guarda citas en esta agenda para dar seguimiento real a tus consultas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Contacto</label>
                  <select
                    value={form.participantId}
                    onChange={(event) => {
                      const nextUser = chatUsers.find((entry) => entry.id === event.target.value) || null;
                      setSelectedUser(nextUser);
                      setForm((prev) => ({ ...prev, participantId: event.target.value }));
                    }}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    disabled={chatUsers.length === 0}
                  >
                    <option value="">Selecciona un chat</option>
                    {chatUsers.map((chatUser) => (
                      <option key={chatUser.id} value={chatUser.id}>
                        {chatUser.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Fecha</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Hora</label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Modalidad</label>
                  <select
                    value={form.mode}
                    onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Videollamada">Videollamada</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Notas</label>
                  <Input
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Ej. llevar estudios o revisar medicamento"
                  />
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={createNewConsultation}
                  disabled={creating || chatUsers.length === 0}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {creating ? 'Guardando...' : 'Agregar a mi agenda'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Próximas consultas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingConsultations.length === 0 ? (
                  <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                    Todavía no tienes próximas citas.
                  </div>
                ) : (
                  upcomingConsultations.map((entry) => (
                    <div key={`${entry.id}-upcoming`} className="rounded-2xl border border-border p-3">
                      <p className="font-medium">{entry.participantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.scheduledAt).toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
