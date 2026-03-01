import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { FileText, Upload, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Documents({ user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const ACCEPTED_EXTS = [
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff',
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'
  ];
  const ACCEPTED_MIME = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf'
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const isValidFile = (file) => {
    if (!file) return false;
    if (file.type && (file.type.startsWith('image/') || ACCEPTED_MIME.includes(file.type))) {
      return true;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ACCEPTED_EXTS.includes(ext);
  };

  const uploadDocumentFile = async (file) => {
    if (!isValidFile(file)) {
      toast.error('Formato no soportado. Usa PDF, imágenes o documentos Office.');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Documento subido exitosamente');
      loadDocuments();
      setUploadOpen(false);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 403) {
        toast.error('Solo los pacientes pueden subir documentos');
      } else if (status === 401) {
        toast.error('Sesión expirada. Vuelve a iniciar sesión');
      } else if (status === 422) {
        toast.error('Archivo inválido o sin contenido');
      } else {
        toast.error('Error al subir documento');
      }
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

  const downloadDocument = async (docId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Decode base64 and create download link
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

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Documentos Médicos
          </h1>
          <p className="text-muted-foreground text-lg">Gestiona tus análisis y archivos médicos</p>
        </div>

        <Card data-testid="upload-card" className="border-border/50 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Subir Documento</CardTitle>
            <CardDescription>Sube análisis, recetas, imágenes médicas, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                data-testid="upload-button"
                onClick={() => setUploadOpen(true)}
                disabled={uploading}
                className="rounded-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
              </Button>
              <p className="text-sm text-muted-foreground">PDF, imágenes, documentos de Word, etc.</p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Subir documento</DialogTitle>
              <DialogDescription>
                Arrastra y suelta un archivo o selecciónalo desde tu computadora.
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
                PDF, JPG, PNG, DOCX, XLSX y formatos similares
              </p>
              <Button onClick={openFilePicker} variant="outline" className="rounded-full">
                Elegir archivo
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                data-testid="file-upload-input"
                onChange={onFileChange}
                accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                className="hidden"
                disabled={uploading}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Card data-testid="documents-list-card" className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Tus Documentos</CardTitle>
            <CardDescription>{documents.length} documento(s) guardado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay documentos aún</p>
                <p className="text-sm text-muted-foreground mt-2">Sube tu primer documento médico</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    data-testid={`document-item-${idx}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover-lift"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          Subido el {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Button
                      data-testid={`download-document-button-${idx}`}
                      onClick={() => downloadDocument(doc.id, doc.filename)}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
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
    </div>
  );
}
