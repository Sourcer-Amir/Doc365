import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function Profile({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(Boolean(user?.telegram_chat_id));
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '' });

  useEffect(() => {
    loadProfile();
    loadTelegramStatus();
  }, []);

  useEffect(() => {
    setTelegramConnected(Boolean(user?.telegram_chat_id));
  }, [user]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      toast.error('Error al cargar el perfil');
    }
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/profile`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
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
      // Keep silent to avoid noisy UX
    }
  };

  const connectTelegram = async () => {
    setTelegramSaving(true);
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
      setTelegramSaving(false);
    }
  };

  const disconnectTelegram = async () => {
    setTelegramSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/user/telegram`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegramConnected(false);
      localStorage.setItem('user', JSON.stringify({ ...user, telegram_chat_id: null }));
      toast.success('Telegram desconectado');
    } catch (error) {
      toast.error('No se pudo desconectar Telegram');
    } finally {
      setTelegramSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      const updated = [...(profile.allergies || []), newAllergy.trim()];
      updateProfile({ allergies: updated });
      setNewAllergy('');
    }
  };

  const addLanguage = () => {
    if (!newLanguage.trim()) return;
    const candidate = newLanguage.trim();
    const exists = (profile.languages || []).some((item) => item.toLowerCase() === candidate.toLowerCase());
    if (exists) {
      setNewLanguage('');
      return;
    }
    const updated = [...(profile.languages || []), candidate];
    updateProfile({ languages: updated });
    setNewLanguage('');
  };

  const removeLanguage = (index) => {
    const updated = (profile.languages || []).filter((_, i) => i !== index);
    updateProfile({ languages: updated });
  };

  const removeAllergy = (index) => {
    const updated = profile.allergies.filter((_, i) => i !== index);
    updateProfile({ allergies: updated });
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      const updated = [...(profile.chronic_conditions || []), newCondition.trim()];
      updateProfile({ chronic_conditions: updated });
      setNewCondition('');
    }
  };

  const removeCondition = (index) => {
    const updated = profile.chronic_conditions.filter((_, i) => i !== index);
    updateProfile({ chronic_conditions: updated });
  };

  const addMedication = () => {
    if (newMed.name.trim()) {
      const updated = [...(profile.current_medications || []), newMed];
      updateProfile({ current_medications: updated });
      setNewMed({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index) => {
    const updated = profile.current_medications.filter((_, i) => i !== index);
    updateProfile({ current_medications: updated });
  };

  if (!profile) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
        <Navigation user={user} onLogout={onLogout} />
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Mi Perfil Médico
          </h1>
          <p className="text-muted-foreground text-lg">Gestiona tu información de salud</p>
        </div>

        <div className="space-y-6">
          <Card data-testid="basic-info-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="blood_type">Tipo de Sangre</Label>
                <Input
                  id="blood_type"
                  data-testid="blood-type-input"
                  value={profile.blood_type || ''}
                  onChange={(e) => setProfile({...profile, blood_type: e.target.value})}
                  onBlur={() => updateProfile({ blood_type: profile.blood_type })}
                  placeholder="Ej: O+, A-, AB+"
                  className="rounded-xl mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="patient-languages-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Idiomas</CardTitle>
              <CardDescription>Idiomas que manejas para tus consultas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  data-testid="new-language-input"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  placeholder="Agregar idioma..."
                  className="rounded-xl"
                />
                <Button data-testid="add-language-button" onClick={addLanguage} className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.languages || []).map((language, idx) => (
                  <Badge key={`${language}-${idx}`} data-testid={`language-badge-${idx}`} variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full">
                    {language}
                    <button data-testid={`remove-language-button-${idx}`} onClick={() => removeLanguage(idx)} className="ml-2 hover:bg-destructive/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(!profile.languages || profile.languages.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hay idiomas registrados</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="telegram-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Telegram</CardTitle>
              <CardDescription>Activa notificaciones con un solo click</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Estado: {telegramConnected ? 'Conectado' : 'No conectado'}
              </p>
              <div className="flex justify-end gap-2">
                <Button onClick={loadTelegramStatus} disabled={telegramSaving} variant="outline" className="rounded-full">
                  Verificar conexión
                </Button>
                {telegramConnected ? (
                  <Button onClick={disconnectTelegram} disabled={telegramSaving} variant="destructive" className="rounded-full">
                    {telegramSaving ? 'Procesando...' : 'Desconectar Telegram'}
                  </Button>
                ) : (
                  <Button onClick={connectTelegram} disabled={telegramSaving} className="rounded-full">
                    {telegramSaving ? 'Generando...' : 'Activa las notificaciones con Telegram'}
                  </Button>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Solo abre el bot desde el botón y presiona Start. No necesitas escribir Chat ID.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="allergies-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Alergias</CardTitle>
              <CardDescription>Registra tus alergias conocidas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  data-testid="new-allergy-input"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  placeholder="Agregar alergia..."
                  className="rounded-xl"
                />
                <Button data-testid="add-allergy-button" onClick={addAllergy} className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.allergies?.map((allergy, idx) => (
                  <Badge key={idx} data-testid={`allergy-badge-${idx}`} variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full">
                    {allergy}
                    <button data-testid={`remove-allergy-button-${idx}`} onClick={() => removeAllergy(idx)} className="ml-2 hover:bg-destructive/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(!profile.allergies || profile.allergies.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hay alergias registradas</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="conditions-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Condiciones Crónicas</CardTitle>
              <CardDescription>Condiciones médicas a largo plazo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  data-testid="new-condition-input"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  placeholder="Agregar condición..."
                  className="rounded-xl"
                />
                <Button data-testid="add-condition-button" onClick={addCondition} className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.chronic_conditions?.map((condition, idx) => (
                  <Badge key={idx} data-testid={`condition-badge-${idx}`} variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full">
                    {condition}
                    <button data-testid={`remove-condition-button-${idx}`} onClick={() => removeCondition(idx)} className="ml-2 hover:bg-destructive/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(!profile.chronic_conditions || profile.chronic_conditions.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hay condiciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="medications-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Medicamentos Actuales</CardTitle>
              <CardDescription>Medicamentos que estás tomando actualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  data-testid="new-medication-name-input"
                  value={newMed.name}
                  onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                  placeholder="Nombre del medicamento"
                  className="rounded-xl"
                />
                <Input
                  data-testid="new-medication-dosage-input"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                  placeholder="Dosis (ej: 500mg)"
                  className="rounded-xl"
                />
                <div className="flex gap-2">
                  <Input
                    data-testid="new-medication-frequency-input"
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                    placeholder="Frecuencia"
                    className="rounded-xl"
                  />
                  <Button data-testid="add-medication-button" onClick={addMedication} className="rounded-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {profile.current_medications?.map((med, idx) => (
                  <div key={idx} data-testid={`medication-item-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div>
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-sm text-muted-foreground">{med.dosage} - {med.frequency}</p>
                    </div>
                    <Button data-testid={`remove-medication-button-${idx}`} onClick={() => removeMedication(idx)} variant="ghost" size="sm" className="rounded-full">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {(!profile.current_medications || profile.current_medications.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hay medicamentos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
