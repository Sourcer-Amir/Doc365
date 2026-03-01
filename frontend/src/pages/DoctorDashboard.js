import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, MessageSquare, Activity, Eye, TrendingUp, AlertCircle, Star, Plus, X, MapPinned, CalendarDays, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* eslint-disable react-hooks/exhaustive-deps */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function DoctorDashboard({ user, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientActions, setShowPatientActions] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(Boolean(user?.telegram_chat_id));
  const [telegramLoading, setTelegramLoading] = useState(false);
  const navigate = useNavigate();

  const normalizeDoctorProfile = (data) => ({
    ...data,
    doctor_languages: Array.isArray(data?.doctor_languages) ? data.doctor_languages : [],
    expected_salary_range: data?.expected_salary_range || '',
    offers_online: Boolean(data?.offers_online),
    offers_in_person: Boolean(data?.offers_in_person)
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadAnalytics();
    loadVerificationStatus();
    loadDoctorProfile();
    loadTelegramStatus();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/verification/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const loadDoctorProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(normalizeDoctorProfile(response.data));
      setTelegramConnected(Boolean(response.data?.telegram_chat_id));
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  const loadTelegramStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/user/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegramConnected(Boolean(response.data.connected));
    } catch (error) {
      // Silent by design
    }
  };

  const connectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/user/telegram/connect-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(response.data.connect_url, '_blank', 'noopener,noreferrer');
      toast.success('Se abrió Telegram. Presiona Start y luego "Verificar conexión".');
    } catch (error) {
      toast.error('No se pudo generar el enlace de Telegram');
    } finally {
      setTelegramLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/user/telegram`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegramConnected(false);
      setProfile((prev) => (prev ? { ...prev, telegram_chat_id: null } : prev));
      localStorage.setItem('user', JSON.stringify({ ...user, telegram_chat_id: null }));
      toast.success('Telegram desconectado');
    } catch (error) {
      toast.error('No se pudo desconectar Telegram');
    } finally {
      setTelegramLoading(false);
    }
  };

  const saveDoctorProfile = async () => {
    if (!profile) return;
    if (!profile.offers_online && !profile.offers_in_person) {
      toast.error('Debes habilitar consulta en línea y/o presencial.');
      return;
    }
    setProfileSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        clinic_address: profile.clinic_address || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        expected_salary_range: profile.expected_salary_range || '',
        offers_online: Boolean(profile.offers_online),
        offers_in_person: Boolean(profile.offers_in_person),
        doctor_languages: (profile.doctor_languages || [])
          .filter((entry) => entry?.language?.trim())
          .map((entry) => ({ language: entry.language.trim(), level: entry.level || 'medio' }))
      };
      const response = await axios.put(`${API}/doctor/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(normalizeDoctorProfile(response.data));
      localStorage.setItem('user', JSON.stringify({ ...user, ...response.data }));
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 8MB');
      return;
    }
    setPhotoUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API}/doctor/profile/photo`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      localStorage.setItem('user', JSON.stringify({ ...user, ...response.data }));
      toast.success('Foto actualizada');
    } catch (error) {
      toast.error('Error al subir la foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  const openPatientActions = (patient) => {
    setSelectedPatient(patient);
    setShowPatientActions(true);
  };

  const goToChat = () => {
    if (!selectedPatient) return;
    setShowPatientActions(false);
    navigate('/chat-doctor', { state: { selectedPatient } });
  };

  const goToHistory = () => {
    if (!selectedPatient) return;
    setShowPatientActions(false);
    navigate('/patient-history', { state: { selectedPatient } });
  };

  const setDoctorLanguage = (index, key, value) => {
    if (!profile) return;
    const updated = [...(profile.doctor_languages || [])];
    updated[index] = { ...updated[index], [key]: value };
    setProfile({ ...profile, doctor_languages: updated });
  };

  const addDoctorLanguage = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      doctor_languages: [...(profile.doctor_languages || []), { language: '', level: 'medio' }]
    });
  };

  const removeDoctorLanguage = (index) => {
    if (!profile) return;
    setProfile({
      ...profile,
      doctor_languages: (profile.doctor_languages || []).filter((_, idx) => idx !== index)
    });
  };

  const monthlyViewsData = analytics?.monthly_views || {};
  const months = Object.keys(monthlyViewsData);
  const maxViews = Math.max(...Object.values(monthlyViewsData), 1);
  const mapQuery = encodeURIComponent(profile?.clinic_address || '');
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${mapQuery}&output=embed` : '';
  const mapOpenUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : '';

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
              Bienvenido, Dr. {user.full_name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground text-lg">{user.specialty}</p>
          </div>
          
          {verificationStatus && !verificationStatus.is_verified && (
            <Button
              data-testid="verification-alert-button"
              onClick={() => navigate('/verification')}
              variant="outline"
              className="rounded-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Completar Verificación
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="profile-views-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Vistas de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">{analytics?.profile_views || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Visualizaciones totales</p>
            </CardContent>
          </Card>

          <Card data-testid="total-patients-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">{analytics?.total_patients || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Pacientes únicos</p>
            </CardContent>
          </Card>

          <Card data-testid="total-chats-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Mensajes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">{analytics?.total_chats || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Consultas totales</p>
            </CardContent>
          </Card>

          <Card data-testid="activity-trend-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Tendencia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading text-green-600">+{months.length > 1 ? Math.round(((monthlyViewsData[months[months.length-1]] || 0) / (monthlyViewsData[months[months.length-2]] || 1) - 1) * 100) : 0}%</p>
              <p className="text-sm text-muted-foreground mt-1">vs mes anterior</p>
            </CardContent>
          </Card>

          <Card data-testid="rating-card" className="hover-lift border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Calificación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-heading">
                {analytics?.avg_rating ? analytics.avg_rating.toFixed(1) : '—'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {analytics?.rating_count || 0} reseñas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Comunicación clínica</CardTitle>
              <CardDescription>Canales directos para tus consultas</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button className="rounded-full" onClick={() => navigate('/chat-doctor')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Mensajes con pacientes
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate('/doctor-network')}>
                <UsersRound className="w-4 h-4 mr-2" />
                Chat con doctores
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate('/consultations')}>
                <CalendarDays className="w-4 h-4 mr-2" />
                Ver calendario
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Ubicación en mapa</CardTitle>
              <CardDescription>Vista previa pública de tu consultorio</CardDescription>
            </CardHeader>
            <CardContent>
              {mapEmbedUrl ? (
                <>
                  <iframe
                    title="Mapa consultorio"
                    src={mapEmbedUrl}
                    className="w-full h-52 rounded-xl border border-border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full mt-3"
                    onClick={() => window.open(mapOpenUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <MapPinned className="w-4 h-4 mr-2" />
                    Abrir en Google Maps
                  </Button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Agrega la dirección del consultorio para mostrar el mapa.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Views Chart */}
          <Card data-testid="monthly-views-chart" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Vistas Mensuales</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {months.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p>Aún no hay datos de vistas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {months.map((month) => {
                    const views = monthlyViewsData[month];
                    const percentage = (views / maxViews) * 100;
                    return (
                      <div key={month} data-testid={`month-stat-${month}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{month}</span>
                          <span className="text-muted-foreground">{views} vistas</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card data-testid="recent-patients-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Pacientes Recientes</CardTitle>
              <CardDescription>Últimas consultas</CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics?.recent_patients || analytics.recent_patients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aún no tienes pacientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recent_patients.map((patient, idx) => (
                    <div
                      key={patient.id}
                      data-testid={`recent-patient-${idx}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover-lift cursor-pointer"
                      onClick={() => openPatientActions(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        Opciones
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="doctor-profile-card" className="border-border/50 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Mi perfil público</CardTitle>
            <CardDescription>
              Esta información se muestra a los pacientes cuando buscan doctores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile ? (
              <p className="text-sm text-muted-foreground">Cargando perfil...</p>
            ) : (
              <>
                <div className="rounded-xl border border-border p-3 bg-secondary/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    Telegram: {telegramConnected ? 'Conectado' : 'No conectado'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={loadTelegramStatus} disabled={telegramLoading} variant="outline" className="rounded-full">
                      Verificar conexión
                    </Button>
                    {telegramConnected ? (
                      <Button onClick={disconnectTelegram} disabled={telegramLoading} variant="destructive" className="rounded-full">
                        {telegramLoading ? 'Procesando...' : 'Desconectar Telegram'}
                      </Button>
                    ) : (
                      <Button onClick={connectTelegram} disabled={telegramLoading} className="rounded-full">
                        {telegramLoading ? 'Generando...' : 'Activa las notificaciones con Telegram'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clinic_address">Dirección del consultorio</Label>
                    <Input
                      id="clinic_address"
                      value={profile.clinic_address || ''}
                      onChange={(e) => setProfile({ ...profile, clinic_address: e.target.value })}
                      placeholder="Av. Salud 123, Ciudad"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_salary_range">Rango o salario esperado</Label>
                  <Input
                    id="expected_salary_range"
                    value={profile.expected_salary_range || ''}
                    onChange={(e) => setProfile({ ...profile, expected_salary_range: e.target.value })}
                    placeholder="Ej: 500-900 MXN por consulta"
                    className="rounded-xl mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modalidad de consulta</Label>
                  <div className="space-y-2 rounded-xl border border-border p-3 bg-secondary/20">
                    <label className="flex items-center gap-3">
                      <Checkbox
                        checked={Boolean(profile.offers_online)}
                        onCheckedChange={(checked) => setProfile({ ...profile, offers_online: checked === true })}
                      />
                      <span className="text-sm">Darás consulta en línea</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <Checkbox
                        checked={Boolean(profile.offers_in_person)}
                        onCheckedChange={(checked) => setProfile({ ...profile, offers_in_person: checked === true })}
                      />
                      <span className="text-sm">Darás consulta en presencial</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Idiomas y nivel</Label>
                  <div className="space-y-2">
                    {(profile.doctor_languages || []).map((entry, idx) => (
                      <div key={`doctor-language-${idx}`} className="grid grid-cols-12 gap-2">
                        <Input
                          className="rounded-xl col-span-7"
                          placeholder="Idioma"
                          value={entry.language || ''}
                          onChange={(e) => setDoctorLanguage(idx, 'language', e.target.value)}
                        />
                        <Select
                          value={entry.level || 'medio'}
                          onValueChange={(value) => setDoctorLanguage(idx, 'level', value)}
                        >
                          <SelectTrigger className="rounded-xl col-span-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="avanzado">Avanzado</SelectItem>
                            <SelectItem value="medio">Medio</SelectItem>
                            <SelectItem value="principiante">Principiante</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDoctorLanguage(idx)}
                          className="rounded-full col-span-1 px-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addDoctorLanguage} className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar idioma
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="profile_photo">Foto de perfil</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-border">
                      {profile.profile_photo_url ? (
                        <img
                          src={profile.profile_photo_url}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div>
                      <Input
                        id="profile_photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadProfilePhoto(e.target.files?.[0])}
                        disabled={photoUploading}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG o JPG, máximo 8MB (se comprime automáticamente)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Descripción profesional</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Breve resumen de tu experiencia y enfoque clínico."
                    className="rounded-xl mt-1 min-h-[120px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveDoctorProfile} disabled={profileSaving} className="rounded-full">
                    {profileSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPatientActions} onOpenChange={setShowPatientActions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acciones del paciente</DialogTitle>
            <DialogDescription>
              {selectedPatient ? `Selecciona una acción para ${selectedPatient.full_name}.` : 'Selecciona una acción.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Button onClick={goToChat} className="rounded-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ir al chat
            </Button>
            <Button onClick={goToHistory} variant="outline" className="rounded-full">
              Ver historial clínico
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
