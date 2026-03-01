import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  Clock3
} from 'lucide-react';

export default function VideoCall({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const callPeer = location.state?.callPeer || null;
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const durationText = useMemo(() => {
    const minutes = Math.floor(callSeconds / 60);
    const seconds = callSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callSeconds]);

  const peerInitials = useMemo(() => {
    if (!callPeer?.full_name) return 'DR';
    return callPeer.full_name
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [callPeer]);

  const selfInitials = useMemo(() => {
    return (user?.full_name || 'Usuario')
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.full_name]);

  const endCall = () => {
    navigate('/chat-doctor', {
      state: {
        selectedDoctor: user?.role === 'patient' ? callPeer : undefined,
        selectedPatient: user?.role === 'doctor' ? callPeer : undefined
      }
    });
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Videollamada</h1>
            <p className="text-muted-foreground">
              {callPeer ? `Llamada con ${callPeer.full_name}` : 'Sala de consulta virtual'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full px-3 py-1.5">
              <Clock3 className="w-4 h-4 mr-2" />
              {durationText}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 border-border/50 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="relative rounded-2xl border border-border bg-black/85 min-h-[460px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Avatar className="w-20 h-20 mx-auto mb-3">
                      <AvatarFallback className="text-lg bg-emerald-600 text-white">{peerInitials}</AvatarFallback>
                    </Avatar>
                    <p className="text-lg font-semibold">{callPeer?.full_name || 'Doctor/a'}</p>
                    <p className="text-sm text-white/70">{callPeer?.specialty || 'Consulta médica'}</p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl border border-white/20 bg-slate-800 flex items-center justify-center">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-slate-600 text-white">{selfInitials}</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant={micOn ? 'outline' : 'default'}
                  className="rounded-full"
                  onClick={() => setMicOn((prev) => !prev)}
                >
                  {micOn ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                  {micOn ? 'Micrófono encendido' : 'Micrófono apagado'}
                </Button>
                <Button
                  variant={cameraOn ? 'outline' : 'default'}
                  className="rounded-full"
                  onClick={() => setCameraOn((prev) => !prev)}
                >
                  {cameraOn ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                  {cameraOn ? 'Cámara encendida' : 'Cámara apagada'}
                </Button>
                <Button
                  variant={screenSharing ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setScreenSharing((prev) => !prev)}
                >
                  <MonitorUp className="w-4 h-4 mr-2" />
                  {screenSharing ? 'Compartiendo pantalla' : 'Compartir pantalla'}
                </Button>
                <Button
                  variant={chatOpen ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setChatOpen((prev) => !prev)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat rápido
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full ml-auto"
                  onClick={endCall}
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Finalizar llamada
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Panel de consulta</CardTitle>
              <CardDescription>Información rápida para la llamada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-border p-3">
                <p className="font-semibold">Participantes</p>
                <p className="text-muted-foreground mt-1">{user?.full_name}</p>
                <p className="text-muted-foreground">{callPeer?.full_name || 'Doctor/a'}</p>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="font-semibold">Estado de audio/video</p>
                <p className="text-muted-foreground mt-1">Micrófono: {micOn ? 'Activo' : 'Silenciado'}</p>
                <p className="text-muted-foreground">Cámara: {cameraOn ? 'Activa' : 'Apagada'}</p>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="font-semibold">Chat in-call</p>
                <p className="text-muted-foreground mt-1">
                  {chatOpen
                    ? 'Panel de mensajes activo.'
                    : 'Activa "Chat rápido" para mostrar mensajes durante la consulta.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
