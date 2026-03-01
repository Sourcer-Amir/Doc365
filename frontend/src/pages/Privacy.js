import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import axios from 'axios';
import { Shield, Trash2, AlertTriangle, Lock, Eye, Download, Bot } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function Privacy({ user, onLogout }) {
  const [deleting, setDeleting] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);

  useEffect(() => {
    loadAiConsent();
  }, []);

  const loadAiConsent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/ai/consent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiConsent(Boolean(response.data.ai_consent));
    } catch (error) {
      console.error('Error loading AI consent:', error);
    }
  };

  const updateAiConsent = async (value) => {
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/ai/consent`,
        { ai_consent: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = Boolean(response.data.ai_consent);
      setAiConsent(updated);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ai_consent: updated }));
      }
      toast.success(updated ? 'IA habilitada' : 'IA deshabilitada');
    } catch (error) {
      toast.error('No se pudo actualizar la preferencia de IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiToggle = (checked) => {
    if (checked) {
      setShowAiDialog(true);
      return;
    }
    updateAiConsent(false);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/user/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cuenta eliminada exitosamente');
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (error) {
      toast.error('Error al eliminar la cuenta');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Privacidad y Datos
          </h1>
          <p className="text-muted-foreground text-lg">Gestiona tu privacidad y datos personales</p>
        </div>

        <div className="space-y-6">
          <Card data-testid="privacy-info-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-heading">Tu Privacidad es Importante</CardTitle>
                  <CardDescription>Entendemos la sensibilidad de tu información médica</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold font-heading mb-1">Datos Encriptados</h4>
                  <p className="text-sm text-muted-foreground">
                    Todos tus datos médicos están protegidos con encriptación de grado bancario y almacenados de forma segura.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold font-heading mb-1">Control Total</h4>
                  <p className="text-sm text-muted-foreground">
                    Tú decides quién puede ver tu información. Los médicos solo acceden a los datos que compartes en las consultas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Download className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold font-heading mb-1">Portabilidad de Datos</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes descargar todos tus datos en cualquier momento. Tu información te pertenece.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="ai-consent-card" className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-heading">Consentimiento para IA</CardTitle>
                  <CardDescription>
                    Controla si deseas usar el asistente IA y recomendaciones automáticas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <p className="font-semibold font-heading">Habilitar funciones IA</p>
                  <p className="text-sm text-muted-foreground">
                    Necesitamos tu consentimiento explícito para procesar tu información médica con IA.
                  </p>
                </div>
                <Switch
                  checked={aiConsent}
                  onCheckedChange={handleAiToggle}
                  disabled={aiLoading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Puedes desactivar estas funciones en cualquier momento. Sin consentimiento, la app
                seguirá funcionando pero sin IA.
              </p>
            </CardContent>
          </Card>

          <AlertDialog open={showAiDialog} onOpenChange={setShowAiDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Consentimiento para usar IA</AlertDialogTitle>
                <AlertDialogDescription>
                  Al activar la IA, aceptas que la información médica que compartas sea procesada
                  automáticamente para generar recomendaciones generales. La IA no diagnostica ni sustituye
                  a profesionales de salud, y sus respuestas no deben considerarse prescripción médica.
                  Puedes desactivar esta función en cualquier momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full"
                  onClick={() => updateAiConsent(true)}
                >
                  Acepto y habilito IA
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Card data-testid="delete-account-card" className="border-destructive/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl font-heading text-destructive">Zona de Peligro</CardTitle>
                  <CardDescription>Acciones irreversibles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                <h4 className="font-semibold font-heading mb-2">Eliminar Cuenta y Datos</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta acción eliminará permanentemente:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-6 ml-4 list-disc">
                  <li>Tu cuenta de usuario</li>
                  <li>Todo tu historial médico</li>
                  <li>Tus medicamentos y alergias registradas</li>
                  <li>Todas las conversaciones con médicos y el asistente IA</li>
                  <li>Documentos médicos subidos</li>
                  <li>Recomendaciones generadas</li>
                </ul>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      data-testid="delete-account-button"
                      variant="destructive"
                      className="rounded-full"
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? 'Eliminando...' : 'Eliminar Mi Cuenta'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
                        y todos tus datos de nuestros servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="cancel-delete-button" className="rounded-full">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="confirm-delete-button"
                        onClick={deleteAccount}
                        className="rounded-full bg-destructive hover:bg-destructive/90"
                      >
                        Sí, eliminar mi cuenta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
