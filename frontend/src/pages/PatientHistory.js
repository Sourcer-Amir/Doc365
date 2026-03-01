import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, FileText, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ');
};

const formatItem = (item) => {
  if (item === null || item === undefined) return 'Sin datos';
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  if (Array.isArray(item)) {
    return item.map(formatItem).join(', ');
  }
  if (typeof item === 'object') {
    return Object.entries(item)
      .map(([key, value]) => `${formatLabel(key)}: ${value ?? '—'}`)
      .join(' • ');
  }
  return String(item);
};

const renderList = (items, emptyLabel = 'Sin datos') => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <Badge key={idx} variant="secondary" className="rounded-full">
          {formatItem(item)}
        </Badge>
      ))}
    </div>
  );
};

export default function PatientHistory({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPatient = location.state?.selectedPatient;
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient?.id) {
      loadHistory(selectedPatient.id);
    }
  }, [selectedPatient?.id]);

  const loadHistory = async (patientId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/patients/${patientId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      toast.error('Error al cargar el historial clínico');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (patientId, docId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/patients/${patientId}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const byteCharacters = atob(response.data.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: response.data.file_type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Documento descargado');
    } catch (error) {
      toast.error('Error al descargar documento');
    }
  };

  if (!selectedPatient) {
    return (
      <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
        <Navigation user={user} onLogout={onLogout} />
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Historial clínico</CardTitle>
              <CardDescription>No se encontró el paciente seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="rounded-full">
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const patientData = history?.patient || selectedPatient;
  const profile = history?.profile;
  const documents = history?.documents || [];

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
              Historial clínico
            </h1>
            <p className="text-muted-foreground text-lg">{patientData.full_name}</p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Cargando historial...</div>
        ) : (
          <div className="space-y-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Información del paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><span className="font-semibold">Nombre:</span> {patientData.full_name}</p>
                <p className="text-sm"><span className="font-semibold">Email:</span> {patientData.email}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Perfil médico</CardTitle>
                <CardDescription>Información de salud registrada por el paciente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-semibold mb-2">Tipo de sangre</p>
                  <Badge variant="outline" className="rounded-full">
                    {profile?.blood_type || 'No especificado'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Alergias</p>
                  {renderList(profile?.allergies, 'No hay alergias registradas')}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Condiciones crónicas</p>
                  {renderList(profile?.chronic_conditions, 'No hay condiciones registradas')}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Medicamentos actuales</p>
                  {renderList(profile?.current_medications, 'No hay medicamentos registrados')}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Historial médico</p>
                  {renderList(profile?.medical_history, 'No hay historial registrado')}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Contacto de emergencia</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.emergency_contact ? formatItem(profile.emergency_contact) : 'No registrado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Documentos médicos</CardTitle>
                <CardDescription>{documents.length} documento(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay documentos disponibles
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        data-testid={`patient-doc-${idx}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              Subido el {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => downloadDocument(patientData.id, doc.id, doc.filename)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
