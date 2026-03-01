import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function DoctorVerification({ user, onLogout }) {
  const [status, setStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctor/verification/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValidFile = (file) => {
    if (!file) return false;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext);
  };

  const uploadDocumentFile = async (file) => {
    if (!isValidFile(file)) {
      toast.error('Formato no soportado. Usa PDF, JPG, PNG, DOC o DOCX.');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API}/doctor/verification/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Documento subido exitosamente');
      loadVerificationStatus();
      setUploadOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadDocumentFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadDocumentFile(file);
  };

  const getStatusInfo = () => {
    if (!status) return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Verificando...' };
    
    if (status.is_verified) {
      return { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        text: 'Verificado' 
      };
    }

    switch (status.verification_status) {
      case 'pending_review':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-100',
          text: 'En revisión automática' 
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'Rechazado'
        };
      case 'pending':
        return { 
          icon: AlertCircle, 
          color: 'text-orange-600', 
          bg: 'bg-orange-100',
          text: 'Pendiente' 
        };
      default:
        return { 
          icon: AlertCircle, 
          color: 'text-gray-500', 
          bg: 'bg-gray-100',
          text: 'No iniciado' 
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
        <Navigation user={user} onLogout={onLogout} />
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <p className="text-center text-muted-foreground">Cargando...</p>
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
            Verificación Profesional
          </h1>
          <p className="text-muted-foreground text-lg">Valida tus credenciales médicas</p>
        </div>

        <Alert data-testid="verification-status-alert" className={`mb-6 ${statusInfo.bg} border-${statusInfo.color.replace('text-', '')}`}>
          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
          <AlertDescription className="ml-2">
            <span className="font-semibold">Estado de verificación: </span>
            <Badge variant="secondary" className="ml-2">{statusInfo.text}</Badge>
          </AlertDescription>
        </Alert>

        {!status?.is_verified && (
          <Card data-testid="upload-verification-card" className="border-border/50 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Subir Documentos de Verificación</CardTitle>
              <CardDescription>
                Por favor sube tus credenciales médicas para verificar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Documentos requeridos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Cédula profesional</li>
                  <li>Certificado de especialidad (si aplica)</li>
                  <li>Identificación oficial</li>
                </ul>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  data-testid="upload-verification-button"
                  onClick={() => setUploadOpen(true)}
                  disabled={uploading}
                  className="rounded-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                </Button>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Subir credenciales médicas</DialogTitle>
              <DialogDescription>
                Arrastra y suelta tu documento o selecciónalo desde tu computadora.
              </DialogDescription>
            </DialogHeader>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                PDF, JPG, PNG, DOC o DOCX (máx. 10MB)
              </p>
              <Button onClick={openFilePicker} variant="outline" className="rounded-full">
                Elegir archivo
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                data-testid="verification-file-input"
                onChange={onFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                disabled={uploading}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Card data-testid="documents-list-card" className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Documentos Subidos</CardTitle>
            <CardDescription>{documents.length} documento(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay documentos subidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    data-testid={`verification-doc-${idx}`}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold">{doc.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Subido el {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="rounded-full"
                      >
                        {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'En revisión'}
                      </Badge>
                    </div>
                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <p className="text-sm text-red-600 mt-3">
                        Motivo: {doc.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
