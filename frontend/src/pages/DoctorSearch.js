import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Search, Users, Eye, MessageSquare, CheckCircle, Stethoscope, Clock, MapPin, Phone, Mail, Star, FileCheck2, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;

export default function DoctorSearch({ user, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseFilter, setResponseFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDoctor, setDetailDoctor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const navigate = useNavigate();

  const loadSpecialties = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/specialties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  }, []);

  const searchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (selectedSpecialty) params.append('specialty', selectedSpecialty);
      if (searchQuery) params.append('search', searchQuery);
      if (responseFilter && responseFilter !== 'all') {
        params.append('max_response_minutes', responseFilter);
      }

      const response = await axios.get(`${API}/doctors/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      toast.error('Error al buscar doctores');
    } finally {
      setLoading(false);
    }
  }, [responseFilter, searchQuery, selectedSpecialty]);

  useEffect(() => {
    loadSpecialties();
    searchDoctors();
  }, [loadSpecialties, searchDoctors]);

  const handleContactDoctor = async (doctor) => {
    try {
      const token = localStorage.getItem('token');
      // Track view
      await axios.post(`${API}/doctor/${doctor.id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Navigate to chat
      navigate('/chat-doctor', { state: { selectedDoctor: doctor } });
    } catch (error) {
      console.error('Error tracking view:', error);
      navigate('/chat-doctor', { state: { selectedDoctor: doctor } });
    }
  };

  const formatResponseTime = (minutes) => {
    if (minutes === null || minutes === undefined) return 'Sin datos';
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    return `${hours} h`;
  };

  const openDoctorDetail = async (doctor) => {
    setDetailDoctor(doctor);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors/${doctor.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetailDoctor(response.data);
    } catch (error) {
      toast.error('Error al cargar la información del doctor');
    } finally {
      setDetailLoading(false);
    }
  };

  const renderRating = (avgRating, count) => {
    const value = avgRating ? avgRating.toFixed(1) : '—';
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Star className="w-4 h-4 text-amber-500" />
        <span className="text-foreground font-semibold">{value}</span>
        <span>({count || 0})</span>
      </div>
    );
  };

  const submitRating = async (rating) => {
    if (!detailDoctor) return;
    setRatingSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/doctors/${detailDoctor.id}/rating`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetailDoctor({
        ...detailDoctor,
        avg_rating: response.data.avg_rating,
        rating_count: response.data.rating_count
      });
      toast.success('Calificación enviada');
      searchDoctors();
    } catch (error) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      if (status === 400 && detail === 'No chat history with this doctor') {
        toast.error('Solo puedes calificar después de chatear con este doctor');
      } else if (status === 401) {
        toast.error('Sesión expirada. Vuelve a iniciar sesión');
      } else if (status === 403) {
        toast.error('Solo los pacientes pueden calificar doctores');
      } else if (detail) {
        toast.error(detail);
      } else {
        toast.error('No se pudo enviar la calificación');
      }
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSearch = () => {
    searchDoctors();
  };

  const submitReport = () => {
    if (!reportReason.trim()) {
      toast.error('Agrega una razón para el reporte');
      return;
    }
    toast.success('Reporte enviado a moderación (demo UI)');
    setReportOpen(false);
    setReportReason('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchDoctors();
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
            Buscar Doctores
          </h1>
          <p className="text-muted-foreground text-lg">Encuentra especialistas médicos verificados</p>
        </div>

        {/* Search Filters */}
        <Card data-testid="search-filters-card" className="border-border/50 shadow-lg mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Select 
                  value={selectedSpecialty} 
                  onValueChange={(value) => {
                    setSelectedSpecialty(value);
                    setTimeout(() => searchDoctors(), 100);
                  }}
                >
                  <SelectTrigger data-testid="specialty-filter-select" className="rounded-xl">
                    <SelectValue placeholder="Todas las especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Select
                  value={responseFilter}
                  onValueChange={(value) => {
                    setResponseFilter(value);
                    setTimeout(() => searchDoctors(), 100);
                  }}
                >
                  <SelectTrigger data-testid="response-filter-select" className="rounded-xl">
                    <SelectValue placeholder="Tiempo de respuesta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier tiempo</SelectItem>
                    <SelectItem value="5">Hasta 5 min</SelectItem>
                    <SelectItem value="15">Hasta 15 min</SelectItem>
                    <SelectItem value="30">Hasta 30 min</SelectItem>
                    <SelectItem value="60">Hasta 1 hora</SelectItem>
                    <SelectItem value="240">Hasta 4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Input
                  data-testid="search-doctors-input"
                  type="text"
                  placeholder="Buscar por nombre o especialidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="rounded-xl"
                />
                <Button 
                  data-testid="search-doctors-button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="rounded-full px-6"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {doctors.length} {doctors.length === 1 ? 'doctor encontrado' : 'doctores encontrados'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Buscando doctores...</p>
          </div>
        ) : doctors.length === 0 ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="py-12 text-center">
              <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No se encontraron doctores</p>
              <p className="text-sm text-muted-foreground">Intenta ajustar tus filtros de búsqueda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, idx) => (
              <Card 
                key={doctor.id} 
                data-testid={`doctor-card-${idx}`}
                className="hover-lift border-border/50 shadow-lg cursor-pointer"
                onClick={() => openDoctorDetail(doctor)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Avatar className="w-16 h-16">
                      {doctor.profile_photo_url && (
                        <AvatarImage src={doctor.profile_photo_url} alt={doctor.full_name} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                        {doctor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.is_verified && (
                      <Badge 
                        data-testid={`verified-badge-${idx}`}
                        variant="default" 
                        className="rounded-full bg-green-100 text-green-700 border-green-200"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg font-heading">{doctor.full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    {doctor.specialty}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{doctor.profile_views || 0} vistas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{doctor.total_patients || 0} pacientes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatResponseTime(doctor.avg_response_minutes)}</span>
                    </div>
                    {renderRating(doctor.avg_rating, doctor.rating_count)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      data-testid={`doctor-details-button-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDoctorDetail(doctor);
                      }}
                      variant="outline"
                      className="w-1/2 rounded-full"
                    >
                      Ver detalles
                    </Button>
                    <Button
                      data-testid={`contact-doctor-button-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactDoctor(doctor);
                      }}
                      className="w-1/2 rounded-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Información del doctor</DialogTitle>
            <DialogDescription>
              Detalles del especialista seleccionado.
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detailDoctor ? (
            <div className="text-sm text-muted-foreground">Cargando información...</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  {detailDoctor.profile_photo_url ? (
                    <img
                      src={detailDoctor.profile_photo_url}
                      alt={detailDoctor.full_name}
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {detailDoctor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-heading font-semibold">{detailDoctor.full_name}</h3>
                  {detailDoctor.is_verified ? (
                    <Badge variant="default" className="rounded-full bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full">
                      No verificado
                    </Badge>
                  )}
                </div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    {detailDoctor.specialty || 'Especialidad no registrada'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{detailDoctor.clinic_address || 'Dirección no especificada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{detailDoctor.phone || 'Teléfono no registrado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{detailDoctor.email || 'Correo no registrado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Respuesta promedio: {formatResponseTime(detailDoctor.avg_response_minutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>
                    Rating: {detailDoctor.avg_rating ? detailDoctor.avg_rating.toFixed(1) : '—'} ({detailDoctor.rating_count || 0})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Modalidad:
                    {' '}
                    {detailDoctor.offers_online ? 'En línea' : ''}
                    {detailDoctor.offers_online && detailDoctor.offers_in_person ? ' + ' : ''}
                    {detailDoctor.offers_in_person ? 'Presencial' : ''}
                    {!detailDoctor.offers_online && !detailDoctor.offers_in_person ? 'No especificada' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>Rango esperado: {detailDoctor.expected_salary_range || 'No especificado'}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Idiomas</p>
                <div className="flex flex-wrap gap-2">
                  {(detailDoctor.doctor_languages || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No especificados</p>
                  ) : (
                    (detailDoctor.doctor_languages || []).map((entry, idx) => (
                      <Badge key={`doctor-language-${idx}`} variant="secondary" className="rounded-full">
                        {entry.language} · {entry.level}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Descripción</p>
                <p className="text-sm text-muted-foreground">
                  {detailDoctor.bio || 'Sin descripción.'}
                </p>
              </div>

              {detailDoctor.clinic_address && (
                <div>
                  <p className="text-sm font-semibold mb-2">Ubicación del consultorio</p>
                  <iframe
                    title="Mapa consultorio doctor"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(detailDoctor.clinic_address)}&output=embed`}
                    className="w-full h-56 rounded-xl border border-border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full mt-3"
                    onClick={() => window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailDoctor.clinic_address)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Abrir ubicación en Maps
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setCertificateOpen(true)}>
                  <FileCheck2 className="w-4 h-4 mr-2" />
                  Ver certificado
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setReportOpen(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Reportar doctor
                </Button>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Calificar doctor</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      disabled={ratingSubmitting}
                      onClick={() => submitRating(value)}
                      className="rounded-full"
                    >
                      {value} <Star className="w-4 h-4 ml-1 text-amber-500" />
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Solo puedes calificar si ya tuviste un chat con este doctor.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleContactDoctor(detailDoctor)} className="rounded-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contactar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificado del doctor</DialogTitle>
            <DialogDescription>
              Vista de certificado en modo demo para competencia.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="font-semibold mb-1">{detailDoctor?.full_name || 'Doctor'}</p>
            <p className="text-sm text-muted-foreground">
              El certificado real se conectará por API de moderación. Por ahora, esta vista es informativa.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setCertificateOpen(false)} className="rounded-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reportar doctor</DialogTitle>
            <DialogDescription>
              Este reporte llegará a moderación. UI demo sin backend por ahora.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="doctor-report-reason">Motivo del reporte</Label>
            <Textarea
              id="doctor-report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe el motivo del reporte..."
              className="rounded-xl min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReportOpen(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button type="button" onClick={submitReport} className="rounded-full">
              Enviar reporte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
