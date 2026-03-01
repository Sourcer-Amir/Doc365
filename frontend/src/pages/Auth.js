import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;
const DEFAULT_DOCTOR_LANGUAGE = { language: 'Español', level: 'avanzado' };

export default function Auth({ onLogin, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [doctorCertificate, setDoctorCertificate] = useState(null);
  const [newPatientLanguage, setNewPatientLanguage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient',
    specialty: '',
    doctor_languages: [DEFAULT_DOCTOR_LANGUAGE],
    expected_salary_range: '',
    offers_online: true,
    offers_in_person: false,
    patient_languages: ['Español']
  });

  const passwordRuleText = 'Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.';

  const passwordMeetsPolicy = (password) => {
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    return true;
  };

  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'patient',
      specialty: '',
      doctor_languages: [DEFAULT_DOCTOR_LANGUAGE],
      expected_salary_range: '',
      offers_online: true,
      offers_in_person: false,
      patient_languages: ['Español']
    });
    setDoctorCertificate(null);
    setNewPatientLanguage('');
  }, [isLogin]);

  const setDoctorLanguage = (index, key, value) => {
    const updated = [...formData.doctor_languages];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, doctor_languages: updated });
  };

  const addDoctorLanguage = () => {
    setFormData({
      ...formData,
      doctor_languages: [...formData.doctor_languages, { language: '', level: 'medio' }]
    });
  };

  const removeDoctorLanguage = (index) => {
    const updated = formData.doctor_languages.filter((_, idx) => idx !== index);
    setFormData({
      ...formData,
      doctor_languages: updated.length > 0 ? updated : [{ language: '', level: 'medio' }]
    });
  };

  const addPatientLanguage = () => {
    const value = newPatientLanguage.trim();
    if (!value) return;
    const normalized = value.toLowerCase();
    if (formData.patient_languages.some((item) => item.toLowerCase() === normalized)) {
      setNewPatientLanguage('');
      return;
    }
    setFormData({
      ...formData,
      patient_languages: [...formData.patient_languages, value]
    });
    setNewPatientLanguage('');
  };

  const removePatientLanguage = (index) => {
    setFormData({
      ...formData,
      patient_languages: formData.patient_languages.filter((_, idx) => idx !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && !passwordMeetsPolicy(formData.password)) {
      toast.error(passwordRuleText);
      return;
    }

    if (!isLogin && formData.role === 'doctor') {
      const hasMode = formData.offers_online || formData.offers_in_person;
      if (!hasMode) {
        toast.error('Selecciona consulta en línea y/o presencial.');
        return;
      }
      if (!doctorCertificate) {
        toast.error('Para registrarte como doctor debes subir un certificado.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          specialty: formData.role === 'doctor' ? formData.specialty : undefined,
          doctor_languages: formData.role === 'doctor'
            ? formData.doctor_languages.filter((item) => item.language.trim())
            : undefined,
          expected_salary_range: formData.role === 'doctor'
            ? (formData.expected_salary_range || undefined)
            : undefined,
          offers_online: formData.role === 'doctor' ? formData.offers_online : undefined,
          offers_in_person: formData.role === 'doctor' ? formData.offers_in_person : undefined,
          patient_languages: formData.role === 'patient'
            ? formData.patient_languages.filter((item) => item.trim())
            : undefined
        };

      const response = await axios.post(`${API}${endpoint}`, payload);

      if (!isLogin && formData.role === 'doctor' && doctorCertificate) {
        try {
          const uploadData = new FormData();
          uploadData.append('file', doctorCertificate);
          await axios.post(`${API}/doctor/verification/upload`, uploadData, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          toast.success('Certificado subido correctamente.');
        } catch (uploadError) {
          toast.error(uploadError.response?.data?.detail || 'No se pudo subir el certificado');
        }
      }

      toast.success(isLogin ? '¡Bienvenido de nuevo!' : '¡Cuenta creada exitosamente!');
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      const detail = error.response?.data?.detail || 'Error en la autenticación';
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    toast.success('Flujo Google listo en frontend');
    toast('Conecta este botón al endpoint OAuth cuando tengas backend.');
  };

  return (
    <div
      className="min-h-screen flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}
    >
      <div className="w-full max-w-lg relative my-2 md:my-0">
        {onClose && (
          <Button
            data-testid="close-auth-button"
            onClick={onClose}
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10 rounded-full bg-background/95"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        <div className="text-center mb-6 mt-10 md:mt-0">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <BrandLogo size={32} iconClassName="text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-heading text-foreground mb-2">Doctor365</h1>
          <p className="text-muted-foreground">Tu salud, nuestra prioridad</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Accede a tu cuenta médica' : 'Únete a nuestra comunidad de salud'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      data-testid="register-fullname-input"
                      type="text"
                      placeholder="Juan Pérez"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo de Usuario</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger data-testid="register-role-select" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Paciente</SelectItem>
                        <SelectItem value="doctor">Médico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === 'doctor' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad</Label>
                        <Input
                          id="specialty"
                          data-testid="register-specialty-input"
                          type="text"
                          placeholder="Cardiología, Pediatría, etc."
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Idiomas que manejas</Label>
                        <div className="space-y-2">
                          {formData.doctor_languages.map((lang, idx) => (
                            <div key={`doctor-language-${idx}`} className="grid grid-cols-12 gap-2">
                              <Input
                                className="rounded-xl col-span-7"
                                placeholder="Idioma"
                                value={lang.language}
                                onChange={(e) => setDoctorLanguage(idx, 'language', e.target.value)}
                              />
                              <Select
                                value={lang.level}
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
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addDoctorLanguage}
                            className="rounded-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar idioma
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expected_salary_range">Rango o salario esperado</Label>
                        <Input
                          id="expected_salary_range"
                          type="text"
                          placeholder="Ej: 500-900 MXN por consulta"
                          value={formData.expected_salary_range}
                          onChange={(e) => setFormData({ ...formData, expected_salary_range: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Modalidad de consulta</Label>
                        <div className="space-y-2 rounded-xl border border-border p-3">
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={formData.offers_online}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                offers_online: checked === true
                              })}
                            />
                            <span className="text-sm">Darás consulta en línea</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={formData.offers_in_person}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                offers_in_person: checked === true
                              })}
                            />
                            <span className="text-sm">Darás consulta en presencial</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doctor_certificate">Certificado profesional</Label>
                        <Input
                          id="doctor_certificate"
                          data-testid="register-doctor-certificate-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => setDoctorCertificate(e.target.files?.[0] || null)}
                          required={formData.role === 'doctor'}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos permitidos: PDF, JPG, PNG, DOC o DOCX.
                        </p>
                      </div>
                    </>
                  )}

                  {formData.role === 'patient' && (
                    <div className="space-y-2">
                      <Label>Idiomas que manejas</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newPatientLanguage}
                          onChange={(e) => setNewPatientLanguage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPatientLanguage())}
                          placeholder="Agregar idioma..."
                          className="rounded-xl"
                        />
                        <Button type="button" variant="outline" className="rounded-full" onClick={addPatientLanguage}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.patient_languages.map((language, idx) => (
                          <Badge key={`${language}-${idx}`} variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full">
                            {language}
                            <button type="button" onClick={() => removePatientLanguage(idx)} className="ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  data-testid={isLogin ? 'login-email-input' : 'register-email-input'}
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  data-testid={isLogin ? 'login-password-input' : 'register-password-input'}
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="rounded-xl"
                />
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    {passwordRuleText}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                data-testid={isLogin ? 'login-submit-button' : 'register-submit-button'}
                className="w-full rounded-full h-11"
                disabled={loading}
              >
                {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o continúa con</span>
                </div>
              </div>

              <Button
                type="button"
                data-testid="google-login-button"
                variant="outline"
                className="w-full rounded-full h-11"
                onClick={handleGoogleAuth}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.6 12 21.6c7 0 9.3-5 9.3-7.6 0-.5-.1-.9-.1-1.2H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M3.8 7.3l3.2 2.4C7.8 7.9 9.7 6.6 12 6.6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 8.2 2 4.9 4.2 3.8 7.3z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M12 21.6c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1.1-3.4 1.1-4 0-5.3-2.6-5.5-3.9l-3.1 2.4C4.9 19.5 8.2 21.6 12 21.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.5 14.1c-.1-.4-.2-.9-.2-1.3s.1-.9.2-1.3L3.4 9.1c-.4.9-.6 1.8-.6 2.8s.2 1.9.6 2.8l3.1-2.4z"
                  />
                </svg>
                {isLogin ? 'Entrar con Google' : 'Registrarse con Google'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                data-testid="toggle-auth-mode-button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
