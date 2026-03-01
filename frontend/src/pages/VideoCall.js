import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Clock3,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings2,
  Video,
  VideoOff,
} from 'lucide-react';
import {
  buildDefaultAgoraChannel,
  loadAgoraRTC,
  loadStoredAgoraConfig,
  saveAgoraConfig,
} from '@/lib/agoraRtc';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

export default function VideoCall({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const callPeer = location.state?.callPeer || null;

  const initialAgoraConfig = useMemo(() => {
    const stored = loadStoredAgoraConfig();
    return {
      appId: stored.appId || '',
      token: stored.token || '',
      channel:
        location.state?.channel || buildDefaultAgoraChannel({ user, callPeer }),
    };
  }, [callPeer, location.state, user]);

  const localPlayerRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({
    audio: null,
    camera: null,
    currentVideo: null,
    screen: null,
  });

  const [agoraConfig, setAgoraConfig] = useState(initialAgoraConfig);
  const [connectionState, setConnectionState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(
    initialAgoraConfig.appId ? 'Listo para conectar' : 'Configura Agora para iniciar'
  );
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const isConnected = connectionState === 'connected';
  const isBusy = connectionState === 'connecting';

  useEffect(() => {
    let timerId = null;

    if (isConnected) {
      timerId = window.setInterval(() => {
        setCallSeconds((previous) => previous + 1);
      }, 1000);
    }

    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    remoteUsers.forEach((remoteUser) => {
      if (remoteUser.videoTrack) {
        const container = document.getElementById(`remote-player-${remoteUser.uid}`);
        if (container) {
          remoteUser.videoTrack.play(container);
        }
      }

      if (remoteUser.audioTrack) {
        remoteUser.audioTrack.play();
      }
    });
  }, [remoteUsers]);

  useEffect(() => {
    return () => {
      void cleanupCall({ nextState: null });
    };
  }, []);

  const requestAgoraSession = useCallback(
    async (requestedChannel, { notifyOnError = false } = {}) => {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        return null;
      }

      const channel = (requestedChannel || initialAgoraConfig.channel || '').trim();
      if (!channel) {
        return null;
      }

      setLoadingSession(true);

      try {
        const response = await axios.get(`${API}/video/agora/config`, {
          params: {
            channel,
            peer_id: callPeer?.id || '',
          },
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const payload = response.data || {};
        const nextConfig = {
          appId: payload.app_id || '',
          token: payload.token || '',
          channel: payload.channel || channel,
        };
        const backendConfigured = Boolean(payload.configured);

        setAgoraConfig((previous) => ({
          ...previous,
          channel: nextConfig.channel || previous.channel,
          appId: backendConfigured ? nextConfig.appId || previous.appId : previous.appId,
          token: backendConfigured ? nextConfig.token : previous.token,
        }));
        setStatusMessage(
          payload.message ||
            (backendConfigured
              ? 'Credenciales de Agora cargadas desde el backend local'
              : 'Configura Agora en el backend local')
        );

        return {
          ...nextConfig,
          configured: backendConfigured,
          tokenRequired: Boolean(payload.token_required),
        };
      } catch (error) {
        console.error('Agora session error:', error);
        if (notifyOnError) {
          toast.error('No se pudieron cargar las credenciales de Agora desde tu backend local');
        }
        return null;
      } finally {
        setLoadingSession(false);
      }
    },
    [callPeer?.id, initialAgoraConfig.channel]
  );

  useEffect(() => {
    void requestAgoraSession(initialAgoraConfig.channel);
  }, [initialAgoraConfig.channel, requestAgoraSession]);

  const syncRemoteUsers = () => {
    const client = clientRef.current;
    setRemoteUsers(client ? [...client.remoteUsers] : []);
  };

  const attachClientListeners = (client) => {
    client.on('user-published', async (remoteUser, mediaType) => {
      await client.subscribe(remoteUser, mediaType);
      syncRemoteUsers();
      if (mediaType === 'audio' && remoteUser.audioTrack) {
        remoteUser.audioTrack.play();
      }
      setStatusMessage(`${remoteUser.uid} se unió a la consulta`);
    });

    client.on('user-unpublished', () => {
      syncRemoteUsers();
    });

    client.on('user-left', () => {
      syncRemoteUsers();
      setStatusMessage('Un participante salió de la sala');
    });
  };

  const cleanupCall = async ({ nextState = 'idle', message = 'Llamada finalizada' } = {}) => {
    const client = clientRef.current;
    const tracks = localTracksRef.current;

    if (client && tracks.currentVideo) {
      try {
        await client.unpublish([tracks.currentVideo]);
      } catch (error) {
        // no-op
      }
    }

    if (client && tracks.audio) {
      try {
        await client.unpublish([tracks.audio]);
      } catch (error) {
        // no-op
      }
    }

    [tracks.audio, tracks.camera, tracks.screen].forEach((track) => {
      if (!track) {
        return;
      }

      try {
        track.stop();
      } catch (error) {
        // no-op
      }

      try {
        track.close();
      } catch (error) {
        // no-op
      }
    });

    localTracksRef.current = {
      audio: null,
      camera: null,
      currentVideo: null,
      screen: null,
    };

    if (client) {
      try {
        await client.leave();
      } catch (error) {
        // no-op
      }

      if (typeof client.removeAllListeners === 'function') {
        client.removeAllListeners();
      }
      clientRef.current = null;
    }

    setRemoteUsers([]);
    setScreenSharing(false);
    setMicOn(true);
    setCameraOn(true);
    setCallSeconds(0);

    if (nextState) {
      setConnectionState(nextState);
      setStatusMessage(message);
    }
  };

  const joinCall = async () => {
    if (isBusy || isConnected) {
      return;
    }

    let runtimeConfig = {
      appId: agoraConfig.appId.trim(),
      channel: agoraConfig.channel.trim(),
      token: agoraConfig.token.trim(),
    };

    const backendSession = await requestAgoraSession(runtimeConfig.channel);
    if (backendSession?.configured) {
      runtimeConfig = {
        appId: backendSession.appId || runtimeConfig.appId,
        channel: backendSession.channel || runtimeConfig.channel,
        token: backendSession.token,
      };
    }

    const appId = runtimeConfig.appId.trim();
    const channel = runtimeConfig.channel.trim();
    const token = runtimeConfig.token.trim();

    if (!appId) {
      toast.error('Configura AGORA_APP_ID en tu backend local o pega tu App ID manualmente');
      return;
    }

    if (!channel) {
      toast.error('Agrega un nombre de canal');
      return;
    }

    setConnectionState('connecting');
    setStatusMessage('Conectando a Agora...');

    try {
      const AgoraRTC = await loadAgoraRTC();
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      clientRef.current = client;
      attachClientListeners(client);

      await client.join(appId, channel, token || null, String(user?.id || 0));

      const [audioTrack, cameraTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);

      localTracksRef.current = {
        audio: audioTrack,
        camera: cameraTrack,
        currentVideo: cameraTrack,
        screen: null,
      };

      if (localPlayerRef.current) {
        cameraTrack.play(localPlayerRef.current);
      }

      await client.publish([audioTrack, cameraTrack]);

      setAgoraConfig(runtimeConfig);
      saveAgoraConfig({ appId, token });
      setRemoteUsers([...client.remoteUsers]);
      setMicOn(true);
      setCameraOn(true);
      setScreenSharing(false);
      setCallSeconds(0);
      setConnectionState('connected');
      setStatusMessage(`Conectado al canal ${channel}`);
      toast.success('Videollamada conectada');
    } catch (error) {
      console.error('Agora join error:', error);
      await cleanupCall({
        nextState: 'error',
        message: error?.message || 'No se pudo iniciar la videollamada',
      });
      toast.error(error?.message || 'No se pudo iniciar la videollamada');
    }
  };

  const leaveCall = async () => {
    await cleanupCall();
    toast.success('Saliste de la videollamada');
  };

  const handleEndAndReturn = async () => {
    await leaveCall();
    navigate('/chat-doctor', {
      state: {
        selectedDoctor: user?.role === 'patient' ? callPeer || undefined : undefined,
        selectedPatient: user?.role === 'doctor' ? callPeer || undefined : undefined,
      },
    });
  };

  const toggleMic = async () => {
    if (!isConnected || !localTracksRef.current.audio) {
      return;
    }

    const nextValue = !micOn;
    await localTracksRef.current.audio.setEnabled(nextValue);
    setMicOn(nextValue);
  };

  const toggleCamera = async () => {
    if (!isConnected || !localTracksRef.current.camera) {
      return;
    }

    const nextValue = !cameraOn;
    await localTracksRef.current.camera.setEnabled(nextValue);
    setCameraOn(nextValue);
  };

  const stopScreenShare = async () => {
    const client = clientRef.current;
    const { camera, screen } = localTracksRef.current;

    if (!client || !screen) {
      return;
    }

    try {
      await client.unpublish([screen]);
    } catch (error) {
      // no-op
    }

    try {
      screen.stop();
      screen.close();
    } catch (error) {
      // no-op
    }

    localTracksRef.current.screen = null;
    localTracksRef.current.currentVideo = camera;

    if (camera) {
      if (localPlayerRef.current) {
        camera.play(localPlayerRef.current);
      }

      try {
        await client.publish([camera]);
      } catch (error) {
        // no-op
      }
    }

    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (!isConnected) {
      return;
    }

    if (screenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      const AgoraRTC = await loadAgoraRTC();
      const screenTrack = await AgoraRTC.createScreenVideoTrack();
      const client = clientRef.current;
      const currentVideoTrack = localTracksRef.current.currentVideo;

      screenTrack.on('track-ended', () => {
        void stopScreenShare();
      });

      if (client && currentVideoTrack) {
        await client.unpublish([currentVideoTrack]);
      }

      localTracksRef.current.screen = screenTrack;
      localTracksRef.current.currentVideo = screenTrack;

      if (localPlayerRef.current) {
        screenTrack.play(localPlayerRef.current);
      }

      if (client) {
        await client.publish([screenTrack]);
      }

      setScreenSharing(true);
    } catch (error) {
      console.error('Agora screen share error:', error);
      toast.error('No se pudo compartir pantalla');
    }
  };

  return (
    <div
      className="min-h-screen pb-8"
      style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}
    >
      <Navigation user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">
              Videollamada en vivo
            </h1>
            <p className="text-muted-foreground">
              {callPeer ? `Canal privado con ${callPeer.full_name}` : 'Sala de consulta virtual'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full px-3 py-1.5">
              <Clock3 className="mr-2 h-4 w-4" />
              {formatDuration(callSeconds)}
            </Badge>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="rounded-full px-3 py-1.5">
              {statusMessage}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <Card className="border-border/50 shadow-lg xl:col-span-3">
            <CardContent className="p-4 md:p-6">
              <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border bg-slate-950">
                {remoteUsers.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                    <p className="text-xl font-semibold">
                      {isConnected
                        ? 'Esperando a que se una la otra persona...'
                        : 'Conecta la sala para iniciar el streaming en tiempo real'}
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-white/70">
                      Ambos participantes deben usar el mismo canal y credenciales de Agora para verse.
                    </p>
                  </div>
                ) : (
                  <div className="grid h-full grid-cols-1 gap-4 p-4 md:grid-cols-2">
                    {remoteUsers.map((remoteUser) => (
                      <div
                        key={remoteUser.uid}
                        className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                      >
                        <div
                          id={`remote-player-${remoteUser.uid}`}
                          className="absolute inset-0"
                        />
                        {!remoteUser.videoTrack && (
                          <div className="absolute inset-0 flex items-center justify-center text-white/70">
                            Cámara remota apagada
                          </div>
                        )}
                        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                          Remoto {remoteUser.uid}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-4 right-4 h-32 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  <div ref={localPlayerRef} className="h-full w-full" />
                  {!isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                      Vista local
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    Tú
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant={isConnected ? 'outline' : 'default'}
                  className="rounded-full"
                  onClick={joinCall}
                  disabled={isConnected || isBusy}
                >
                  <Video className="mr-2 h-4 w-4" />
                  {isBusy ? 'Conectando...' : isConnected ? 'Conectado' : 'Entrar al canal'}
                </Button>

                <Button
                  variant={micOn ? 'outline' : 'default'}
                  className="rounded-full"
                  onClick={toggleMic}
                  disabled={!isConnected}
                >
                  {micOn ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                  {micOn ? 'Micrófono activo' : 'Micrófono apagado'}
                </Button>

                <Button
                  variant={cameraOn ? 'outline' : 'default'}
                  className="rounded-full"
                  onClick={toggleCamera}
                  disabled={!isConnected || screenSharing}
                >
                  {cameraOn ? (
                    <Video className="mr-2 h-4 w-4" />
                  ) : (
                    <VideoOff className="mr-2 h-4 w-4" />
                  )}
                  {cameraOn ? 'Cámara activa' : 'Cámara apagada'}
                </Button>

                <Button
                  variant={screenSharing ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={toggleScreenShare}
                  disabled={!isConnected}
                >
                  <MonitorUp className="mr-2 h-4 w-4" />
                  {screenSharing ? 'Detener pantalla' : 'Compartir pantalla'}
                </Button>

                <Button
                  variant="destructive"
                  className="ml-auto rounded-full"
                  onClick={handleEndAndReturn}
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Salir de la llamada
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 xl:col-span-1">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-heading">Configurar Agora</CardTitle>
                </div>
                <CardDescription>
                  Carga automatica desde tu backend local, con edicion manual como respaldo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => requestAgoraSession(agoraConfig.channel, { notifyOnError: true })}
                  disabled={loadingSession || isBusy}
                >
                  {loadingSession ? 'Leyendo backend local...' : 'Recargar desde backend local'}
                </Button>

                <div>
                  <label className="mb-2 block text-sm font-medium">App ID</label>
                  <Input
                    value={agoraConfig.appId}
                    onChange={(event) =>
                      setAgoraConfig((previous) => ({ ...previous, appId: event.target.value }))
                    }
                    placeholder="Tu App ID de Agora"
                    disabled={isConnected || isBusy}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Token temporal</label>
                  <Input
                    value={agoraConfig.token}
                    onChange={(event) =>
                      setAgoraConfig((previous) => ({ ...previous, token: event.target.value }))
                    }
                    placeholder="Opcional si tu proyecto no exige token"
                    disabled={isConnected || isBusy}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Canal</label>
                  <Input
                    value={agoraConfig.channel}
                    onChange={(event) =>
                      setAgoraConfig((previous) => ({ ...previous, channel: event.target.value }))
                    }
                    placeholder="doctor365-consulta"
                    disabled={isConnected || isBusy}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Si ambos usan este mismo canal, Doctor365 intentara tomar App ID y token del backend
                  local antes de conectarse a Agora.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Estado de la sala</CardTitle>
                <CardDescription>Resumen rápido de la conexión actual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-2xl border border-border p-3">
                  <p className="font-semibold">Participantes remotos</p>
                  <p className="mt-1 text-muted-foreground">{remoteUsers.length}</p>
                </div>

                <div className="rounded-2xl border border-border p-3">
                  <p className="font-semibold">Audio y video</p>
                  <p className="mt-1 text-muted-foreground">
                    Micrófono: {micOn ? 'Activo' : 'Silenciado'}
                  </p>
                  <p className="text-muted-foreground">
                    Cámara: {cameraOn ? 'Activa' : 'Apagada'}
                  </p>
                  <p className="text-muted-foreground">
                    Pantalla: {screenSharing ? 'Compartiéndose' : 'No compartida'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-3">
                  <p className="font-semibold">Canal actual</p>
                  <p className="mt-1 break-all text-muted-foreground">
                    {agoraConfig.channel || 'Sin canal'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
