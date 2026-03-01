import React, { useState } from 'react';
import axios from 'axios';
import BrandLogo from '@/components/BrandLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Activity,
  CheckCircle,
  ChevronRight,
  Clock,
  Languages,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Stethoscope,
  Users,
  Zap,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;
const LANGUAGE_STORAGE_KEY = 'landing_language';

const LANDING_COPY = {
  es: {
    login: 'Iniciar Sesion',
    heroKicker: 'Atencion medica inmediata',
    heroLine1: 'Encuentra un especialista',
    heroLine2: 'con aspecto profesional y confianza real',
    heroDescription:
      'Doctor365 conecta pacientes con medicos verificados en una interfaz clara, moderna y lista para consulta por chat o videollamada.',
    searchPlaceholder: 'Busca cardiologos, dermatologos, pediatras...',
    searchButton: 'Buscar',
    maybeDidYouMean: 'Quiza quisiste decir',
    valueMinutes: 'Respuesta en minutos',
    valueAnywhere: 'Atencion remota',
    valueVerified: 'Perfiles validados',
    valueInstant: 'Chat y video',
    searchResults: 'Resultados de busqueda',
    featuredDoctors: 'Especialistas destacados',
    doctorSingular: 'doctor disponible',
    doctorPlural: 'doctores disponibles',
    searchingDoctors: 'Buscando doctores...',
    noDoctorsFound: 'No se encontraron doctores',
    verified: 'Verificado',
    patients: 'pacientes',
    noData: 'Sin datos',
    contactNow: 'Consultar ahora',
    howItWorks: 'Como funciona',
    step1Title: 'Busca especialidad',
    step1Description: 'Filtra por nombre, sintoma o especialidad y encuentra opciones en segundos.',
    step2Title: 'Elige y conecta',
    step2Description: 'Abre chat o videollamada con un flujo sencillo y sin friccion.',
    step3Title: 'Recibe seguimiento',
    step3Description: 'Centraliza tus consultas, recomendaciones y documentos en un mismo lugar.',
    ctaTitle: 'Un portal medico que se siente serio y facil de usar',
    ctaDescription:
      'Diseñado para que pacientes y doctores encuentren informacion clinica sin ruido visual.',
    ctaButton: 'Comenzar ahora',
    navHome: 'Inicio',
    navAbout: 'Nosotros',
    navServices: 'Servicios',
    navDoctors: 'Doctores',
    heroCardTitle: 'Consulta medica lista',
    heroCardSubtitle: 'Agenda, chat y videollamada integrados',
    heroMiniStat: '96% de pacientes satisfechos',
    heroMiniLabel: 'Perfiles listos para consulta hoy',
  },
  en: {
    login: 'Sign In',
    heroKicker: 'Immediate medical care',
    heroLine1: 'Find the right specialist',
    heroLine2: 'with a cleaner clinical experience',
    heroDescription:
      'Doctor365 connects patients with verified doctors through a polished, modern interface built for chat and video consultations.',
    searchPlaceholder: 'Search cardiologists, dermatologists, pediatricians...',
    searchButton: 'Search',
    maybeDidYouMean: 'Maybe you meant',
    valueMinutes: 'Reply in minutes',
    valueAnywhere: 'Remote care',
    valueVerified: 'Verified profiles',
    valueInstant: 'Chat and video',
    searchResults: 'Search results',
    featuredDoctors: 'Featured specialists',
    doctorSingular: 'doctor available',
    doctorPlural: 'doctors available',
    searchingDoctors: 'Searching doctors...',
    noDoctorsFound: 'No doctors found',
    verified: 'Verified',
    patients: 'patients',
    noData: 'No data',
    contactNow: 'Consult now',
    howItWorks: 'How it works',
    step1Title: 'Search by specialty',
    step1Description: 'Filter by name, symptom, or specialty and find options in seconds.',
    step2Title: 'Choose and connect',
    step2Description: 'Start a chat or video call through a simpler, lower-friction flow.',
    step3Title: 'Get follow-up',
    step3Description: 'Keep consultations, recommendations, and documents in one place.',
    ctaTitle: 'A medical portal that feels serious and easy to use',
    ctaDescription:
      'Built so patients and doctors can find clinical information without visual clutter.',
    ctaButton: 'Get started',
    navHome: 'Home',
    navAbout: 'About',
    navServices: 'Services',
    navDoctors: 'Doctors',
    heroCardTitle: 'Consultation ready',
    heroCardSubtitle: 'Calendar, chat, and video in one flow',
    heroMiniStat: '96% satisfied patients',
    heroMiniLabel: 'Profiles ready for consultation today',
  },
};

function formatResponseTime(minutes, noDataLabel) {
  if (minutes === null || minutes === undefined) {
    return noDataLabel;
  }
  if (minutes < 1) {
    return '<1 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.round(minutes / 60)} h`;
}

export default function LandingPage({ onShowAuth }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return 'es';
    }
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'es';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const copy = LANDING_COPY[language];

  const topNavigation = [
    copy.navHome,
    copy.navAbout,
    copy.navServices,
    copy.navDoctors,
  ];

  const trustPills = [
    { icon: Clock, label: copy.valueMinutes },
    { icon: MapPin, label: copy.valueAnywhere },
    { icon: Shield, label: copy.valueVerified },
    { icon: Zap, label: copy.valueInstant },
  ];

  const normalizeText = (value) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const levenshtein = (a, b) => {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const getSuggestedSpecialty = (query) => {
    if (!query || query.length < 3 || specialties.length === 0) return null;
    const normalizedQuery = normalizeText(query);
    let best = null;
    let bestScore = 0;

    for (const specialty of specialties) {
      const normalizedSpecialty = normalizeText(specialty);
      if (!normalizedSpecialty) continue;
      if (normalizedSpecialty === normalizedQuery) {
        return null;
      }
      const distance = levenshtein(normalizedQuery, normalizedSpecialty);
      const maxLen = Math.max(normalizedQuery.length, normalizedSpecialty.length);
      const similarity = maxLen === 0 ? 0 : 1 - distance / maxLen;
      if (similarity > bestScore) {
        bestScore = similarity;
        best = specialty;
      }
    }

    return bestScore >= 0.7 ? best : null;
  };

  const loadFeaturedDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/public/doctors/search`);
      setDoctors(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query, { allowSuggestion = true } = {}) => {
    if (!query.trim()) {
      loadFeaturedDoctors();
      return;
    }

    setLoading(true);
    try {
      let response = await axios.get(
        `${API}/public/doctors/search?search=${encodeURIComponent(query)}`
      );
      let results = response.data;

      if (results.length === 0 && allowSuggestion) {
        const suggested = getSuggestedSpecialty(query);
        if (suggested) {
          setSuggestion(suggested);
          response = await axios.get(
            `${API}/public/doctors/search?specialty=${encodeURIComponent(suggested)}`
          );
          results = response.data;
        }
      }

      setDoctors(results);
    } catch (error) {
      loadFeaturedDoctors();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSuggestion(null);
    await performSearch(searchQuery);
  };

  const loadSpecialties = async () => {
    try {
      const response = await axios.get(`${API}/public/specialties`);
      setSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const handleContactDoctor = () => {
    onShowAuth();
  };

  const handleGoToLandingTop = () => {
    setSearchQuery('');
    setSuggestion(null);
    loadFeaturedDoctors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    loadSpecialties();
    loadFeaturedDoctors();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return (
    <div className="min-h-screen px-3 py-3 md:px-5 md:py-5">
      <div className="medical-panel mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] border border-white/70">
        <header className="px-5 py-5 md:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              data-testid="header-logo-button"
              aria-label="Ir al inicio"
              onClick={handleGoToLandingTop}
              className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <BrandLogo size={24} />
              </div>
              <div className="text-left">
                <p className="font-heading text-xl font-bold text-foreground">Doctor365</p>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Digital care
                </p>
              </div>
            </button>

            <div className="hidden items-center gap-7 lg:flex">
              {topNavigation.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={handleGoToLandingTop}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Button
                data-testid="header-language-button"
                type="button"
                variant="outline"
                onClick={() => setLanguage((prev) => (prev === 'es' ? 'en' : 'es'))}
                className="rounded-full border-slate-200 bg-white/80"
              >
                <Languages className="mr-2 h-4 w-4" />
                {language.toUpperCase()}
              </Button>
              <Button
                data-testid="header-login-button"
                type="button"
                onClick={onShowAuth}
                className="rounded-full px-6"
              >
                {copy.login}
              </Button>
            </div>
          </div>
        </header>

        <section className="relative px-5 pb-16 pt-4 md:px-10 md:pb-20 md:pt-8">
          <div className="absolute right-8 top-8 hidden h-20 w-20 rounded-3xl medical-dot-grid opacity-70 lg:block" />
          <div className="absolute bottom-20 left-[48%] hidden h-12 w-24 rounded-3xl medical-dot-grid opacity-60 lg:block" />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
            <div>
              <Badge className="mb-5 rounded-full bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10">
                {copy.heroKicker}
              </Badge>

              <h1 className="max-w-3xl text-4xl font-heading font-bold leading-tight text-foreground md:text-6xl">
                {copy.heroLine1}
                <span className="mt-1 block text-primary">{copy.heroLine2}</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {copy.heroDescription}
              </p>

              <div className="mt-8 max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-[0_20px_45px_rgba(37,99,235,0.08)]">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="hero-search-input"
                      type="text"
                      placeholder={copy.searchPlaceholder}
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        if (suggestion) setSuggestion(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="h-14 rounded-[1.2rem] border-transparent bg-secondary pl-12 text-base shadow-none focus-visible:ring-2"
                    />
                  </div>
                  <Button
                    data-testid="hero-search-button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-14 rounded-[1.2rem] px-7"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {copy.searchButton}
                  </Button>
                </div>

                {suggestion && (
                  <div className="px-2 pt-3 text-sm text-muted-foreground">
                    {copy.maybeDidYouMean}{' '}
                    <button
                      type="button"
                      onClick={async () => {
                        setSearchQuery(suggestion);
                        setSuggestion(null);
                        await performSearch(suggestion, { allowSuggestion: false });
                      }}
                      className="font-semibold text-primary underline"
                    >
                      {suggestion}
                    </button>
                    .
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {trustPills.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <div
                      key={pill.label}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm shadow-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{pill.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-x-8 top-10 h-64 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 blur-3xl" />
              <div className="relative rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-[0_28px_55px_rgba(30,64,175,0.12)] md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/80">
                      Doctor365
                    </p>
                    <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">
                      {copy.heroCardTitle}
                    </h2>
                    <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
                      {copy.heroCardSubtitle}
                    </p>
                  </div>
                  <div className="medical-dot-grid h-16 w-16 rounded-3xl opacity-80" />
                </div>

                <div className="relative mt-8 flex min-h-[340px] items-end justify-center overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-100 to-blue-100">
                  <div className="absolute left-6 top-6 rounded-2xl bg-white/90 px-4 py-3 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                      Online now
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{copy.heroMiniLabel}</p>
                  </div>

                  <div className="absolute right-5 top-24 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-lg">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>

                  <div className="absolute bottom-6 right-5 max-w-[220px] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{copy.heroMiniStat}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Chat y seguimiento disponibles para consultas de hoy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mb-0 flex h-[280px] w-[220px] items-center justify-center rounded-t-[7rem] bg-gradient-to-b from-primary/10 to-primary/5">
                    <div className="absolute top-6 h-28 w-28 rounded-full bg-white shadow-inner" />
                    <div className="absolute top-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-2xl font-bold text-white">
                      DR
                    </div>
                    <div className="absolute bottom-0 h-[190px] w-[165px] rounded-t-[4rem] bg-white shadow-[0_-8px_25px_rgba(148,163,184,0.35)]" />
                    <div className="absolute bottom-20 left-12 h-16 w-16 rounded-full border-4 border-slate-300 border-t-transparent" />
                    <div className="absolute bottom-10 h-20 w-[125px] rounded-t-[2rem] border-x-[18px] border-x-transparent border-t-[26px] border-t-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 md:px-10">
          <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
                Discovery
              </p>
              <h2 className="mt-2 text-3xl font-heading font-bold text-foreground md:text-4xl">
                {searchQuery ? copy.searchResults : copy.featuredDoctors}
              </h2>
            </div>
            {doctors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {doctors.length} {doctors.length === 1 ? copy.doctorSingular : copy.doctorPlural}
              </p>
            )}
          </div>

          {loading ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 py-16 text-center">
              <p className="text-muted-foreground">{copy.searchingDoctors}</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card className="rounded-[1.75rem] border-border/50 bg-white/80 shadow-lg">
              <CardContent className="py-14 text-center">
                <Stethoscope className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">{copy.noDoctorsFound}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor, index) => (
                <Card
                  key={doctor.id}
                  data-testid={`featured-doctor-card-${index}`}
                  className="hover-lift rounded-[1.9rem] border-border/50 bg-white/88 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-primary/10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                            {doctor.full_name
                              .split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-heading font-bold text-foreground">
                            {doctor.full_name}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Stethoscope className="h-4 w-4" />
                            {doctor.specialty}
                          </p>
                        </div>
                      </div>

                      {doctor.is_verified && (
                        <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {copy.verified}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-secondary p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          Patients
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          {doctor.total_patients || 0} {copy.patients}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-secondary p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          Response
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {formatResponseTime(doctor.avg_response_minutes, copy.noData)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-primary/[0.06] p-3">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span>Consulta disponible</span>
                      </div>
                      <Button
                        data-testid={`contact-featured-doctor-button-${index}`}
                        onClick={handleContactDoctor}
                        className="rounded-full px-5"
                      >
                        {copy.contactNow}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/55 px-5 py-16 md:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Flow
                </p>
                <h2 className="mt-2 text-3xl font-heading font-bold text-foreground md:text-4xl">
                  {copy.howItWorks}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                La interfaz ahora prioriza lectura, jerarquia visual y una apariencia mas clinica.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { number: '01', title: copy.step1Title, description: copy.step1Description },
                { number: '02', title: copy.step2Title, description: copy.step2Description },
                { number: '03', title: copy.step3Title, description: copy.step3Description },
              ].map((step) => (
                <Card
                  key={step.number}
                  className="rounded-[1.8rem] border-border/50 bg-white/88 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-heading font-bold text-primary">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-10">
          <div className="rounded-[2rem] bg-gradient-to-r from-primary to-accent px-6 py-10 text-white md:px-10 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">
                  Doctor365
                </p>
                <h2 className="mt-3 text-3xl font-heading font-bold md:text-4xl">
                  {copy.ctaTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
                  {copy.ctaDescription}
                </p>
              </div>

              <Button
                data-testid="cta-get-started-button"
                onClick={onShowAuth}
                size="lg"
                className="rounded-full bg-white px-10 text-primary hover:bg-white/90"
              >
                {copy.ctaButton}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
