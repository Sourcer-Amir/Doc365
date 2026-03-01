import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Video, Circle } from 'lucide-react';

const DOCTOR_COLLEAGUES = [
  {
    id: 'doc-col-1',
    full_name: 'Dra. Mariana Torres',
    specialty: 'Cardiología',
    online: true,
  },
  {
    id: 'doc-col-2',
    full_name: 'Dr. Juan Carlos Ríos',
    specialty: 'Neurología',
    online: true,
  },
  {
    id: 'doc-col-3',
    full_name: 'Dra. Lucía Herrera',
    specialty: 'Pediatría',
    online: false,
  },
];

function timeNowLabel() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function DoctorNetwork({ user, onLogout }) {
  const navigate = useNavigate();
  const [selectedColleague, setSelectedColleague] = useState(DOCTOR_COLLEAGUES[0]);
  const [newMessage, setNewMessage] = useState('');
  const [threads, setThreads] = useState({
    'doc-col-1': [
      {
        id: 'm-1',
        sender_id: 'doc-col-1',
        content: 'Hola colega, ¿puedes revisar este caso de hipertensión?',
        time: '09:40',
      },
      {
        id: 'm-2',
        sender_id: 'me',
        content: 'Claro, te comparto una propuesta de seguimiento en un momento.',
        time: '09:43',
      },
    ],
    'doc-col-2': [
      {
        id: 'm-3',
        sender_id: 'doc-col-2',
        content: 'Tengo un paciente con migrañas recurrentes. ¿Has usado ese protocolo?',
        time: '10:11',
      },
    ],
    'doc-col-3': [],
  });

  const currentMessages = useMemo(
    () => threads[selectedColleague?.id] || [],
    [threads, selectedColleague?.id]
  );

  const sendMessage = () => {
    if (!selectedColleague || !newMessage.trim()) return;
    const trimmed = newMessage.trim();
    const nextMessage = {
      id: `m-${Date.now()}`,
      sender_id: 'me',
      content: trimmed,
      time: timeNowLabel(),
    };
    setThreads((prev) => ({
      ...prev,
      [selectedColleague.id]: [...(prev[selectedColleague.id] || []), nextMessage],
    }));
    setNewMessage('');
  };

  const openVideoCall = () => {
    if (!selectedColleague) return;
    navigate('/video-call', { state: { callPeer: selectedColleague } });
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Red de Doctores
          </h1>
          <p className="text-muted-foreground text-lg">
            Comunicación entre especialistas para interconsulta y colaboración.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Colegas</CardTitle>
              <CardDescription>Contactos médicos disponibles</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {DOCTOR_COLLEAGUES.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedColleague(doctor)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border ${
                      selectedColleague?.id === doctor.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {doctor.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm truncate">{doctor.full_name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full ml-auto">
                      <Circle className={`w-3 h-3 mr-1 ${doctor.online ? 'text-emerald-500 fill-emerald-500' : 'text-muted-foreground'}`} />
                      {doctor.online ? 'En línea' : 'Offline'}
                    </Badge>
                  </button>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border/50 shadow-lg">
            <CardHeader>
              {selectedColleague ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{selectedColleague.full_name}</CardTitle>
                    <CardDescription>{selectedColleague.specialty}</CardDescription>
                  </div>
                  <Button type="button" variant="outline" className="rounded-full" onClick={openVideoCall}>
                    <Video className="w-4 h-4 mr-2" />
                    Videollamada entre doctores
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-lg">Selecciona un colega</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] mb-4 pr-4">
                <div className="space-y-4">
                  {currentMessages.map((msg) => {
                    const isOwn = msg.sender_id === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-4 rounded-2xl ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {currentMessages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3" />
                      <p>No hay mensajes aún con este colega.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje para tu colega..."
                  className="rounded-full"
                />
                <Button type="button" onClick={sendMessage} disabled={!newMessage.trim()} className="rounded-full">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
