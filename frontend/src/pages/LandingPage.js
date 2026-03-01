import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare, Clock, MapPin, CheckCircle, Stethoscope, Shield, Zap, Users, Languages } from 'lucide-react';
import axios from 'axios';
import BrandLogo from '@/components/BrandLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://sanarios-backend-api.onrender.com";
const API = `${BACKEND_URL}/api`;
const LANGUAGE_STORAGE_KEY = 'landing_language';
const LANDING_COPY = {
  es: {
    login: 'Iniciar Sesión',
    heroLine1: 'Tu Doctor, Donde y Cuando',
    heroLine2: 'Lo Necesites',
    heroDescription: 'Sana: el especialista que necesitas. Encuentra especialistas verificados en segundos y obtén atención inmediata.',
    searchPlaceholder: 'Busca cardiólogos, dermatólogos, pediatras...',
    searchButton: 'Buscar',
    maybeDidYouMean: 'Quizá quisiste decir',
    valueMinutes: 'Respuesta en minutos',
    valueAnywhere: 'Desde cualquier lugar',
    valueVerified: 'Médicos verificados',
    valueInstant: 'Chat instantáneo',
    searchResults: 'Resultados de Búsqueda',
    featuredDoctors: 'Doctores Destacados',
    doctorSingular: 'doctor disponible',
    doctorPlural: 'doctores disponibles',
    searchingDoctors: 'Buscando doctores...',
    noDoctorsFound: 'No se encontraron doctores',
    verified: 'Verificado',
    patients: 'pacientes',
    noData: 'Sin datos',
    contactNow: 'Consultar Ahora',
    howItWorks: '¿Cómo Funciona?',
    step1Title: 'Busca un Especialista',
    step1Description: 'Encuentra al doctor que necesitas por especialidad o síntoma',
    step2Title: 'Conecta al Instante',
    step2Description: 'Inicia una consulta por chat o video en segundos',
    step3Title: 'Recibe Atención',
    step3Description: 'Obtén diagnóstico, recetas y seguimiento médico',
    ctaTitle: '¿Listo para tu Consulta?',
    ctaDescription: 'Únete a miles de pacientes que ya obtienen atención médica al instante',
    ctaButton: 'Comenzar Ahora'
  },
  en: {
    login: 'Sign In',
    heroLine1: 'Your Doctor, Wherever and Whenever',
    heroLine2: 'You Need It',
    heroDescription: 'Sana: the specialist you need. Find verified specialists in seconds and get immediate care.',
    searchPlaceholder: 'Search cardiologists, dermatologists, pediatricians...',
    searchButton: 'Search',
    maybeDidYouMean: 'Maybe you meant',
    valueMinutes: 'Reply in minutes',
    valueAnywhere: 'From anywhere',
    valueVerified: 'Verified doctors',
    valueInstant: 'Instant chat',
    searchResults: 'Search Results',
    featuredDoctors: 'Featured Doctors',
    doctorSingular: 'doctor available',
    doctorPlural: 'doctors available',
    searchingDoctors: 'Searching doctors...',
    noDoctorsFound: 'No doctors found',
    verified: 'Verified',
    patients: 'patients',
    noData: 'No data',
    contactNow: 'Consult Now',
    howItWorks: 'How It Works',
    step1Title: 'Find a Specialist',
    step1Description: 'Find the doctor you need by specialty or symptom',
    step2Title: 'Connect Instantly',
    step2Description: 'Start a chat or video consultation in seconds',
    step3Title: 'Receive Care',
    step3Description: 'Get diagnosis, prescriptions, and follow-up',
    ctaTitle: 'Ready for Your Consultation?',
    ctaDescription: 'Join thousands of patients who already receive immediate medical care',
    ctaButton: 'Get Started'
  }
};

export default function LandingPage({ onShowAuth }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'es';
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'es';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const copy = LANDING_COPY[language];

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

    if (bestScore >= 0.7) {
      return best;
    }
    return null;
  };

  const performSearch = async (query, { allowSuggestion = true } = {}) => {
    if (!query.trim()) {
      // Show some featured doctors
      loadFeaturedDoctors();
      return;
    }

    setLoading(true);
    try {
      // Search without auth for public browsing
      let response = await axios.get(`${API}/public/doctors/search?search=${encodeURIComponent(query)}`);
      let results = response.data;

      if (results.length === 0 && allowSuggestion) {
        const suggested = getSuggestedSpecialty(query);
        if (suggested) {
          setSuggestion(suggested);
          response = await axios.get(`${API}/public/doctors/search?specialty=${encodeURIComponent(suggested)}`);
          results = response.data;
        }
      }

      setDoctors(results);
    } catch (error) {
      // Show featured doctors on error
      loadFeaturedDoctors();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSuggestion(null);
    await performSearch(searchQuery);
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

  const loadSpecialties = async () => {
    try {
      const response = await axios.get(`${API}/public/specialties`);
      setSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const handleContactDoctor = () => {
    // Show auth modal when trying to contact
    onShowAuth();
  };

  const handleGoToLandingTop = () => {
    setSearchQuery('');
    setSuggestion(null);
    loadFeaturedDoctors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphic px-4 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            data-testid="header-logo-button"
            aria-label="Ir al inicio"
            onClick={handleGoToLandingTop}
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-primary/10 transition-colors"
          >
            <BrandLogo size={32} />
            <span className="text-2xl font-heading font-bold">Sana</span>
          </button>
          <div className="flex items-center gap-2">
            <Button
              data-testid="header-language-button"
              type="button"
              variant="outline"
              onClick={() => setLanguage((prev) => (prev === 'es' ? 'en' : 'es'))}
              className="rounded-full"
            >
              <Languages className="w-4 h-4 mr-2" />
              {language.toUpperCase()}
            </Button>
            <Button 
              data-testid="header-login-button"
              type="button"
              onClick={onShowAuth}
              className="rounded-full"
            >
              {copy.login}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground mb-6 tracking-tight">
            {copy.heroLine1}
            <br />
            <span className="text-primary">{copy.heroLine2}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {copy.heroDescription}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="hero-search-input"
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (suggestion) setSuggestion(null);
                  }}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 text-lg rounded-full border-2"
                />
              </div>
              <Button 
                data-testid="hero-search-button"
                onClick={handleSearch}
                disabled={loading}
                size="lg"
                className="rounded-full px-8 h-14"
              >
                <Search className="w-5 h-5 mr-2" />
                {copy.searchButton}
              </Button>
            </div>
            {suggestion && (
              <div className="mt-3 text-sm text-muted-foreground">
                {copy.maybeDidYouMean}{' '}
                <button
                  type="button"
                  onClick={async () => {
                    setSearchQuery(suggestion);
                    setSuggestion(null);
                    await performSearch(suggestion, { allowSuggestion: false });
                  }}
                  className="text-primary font-semibold underline"
                >
                  {suggestion}
                </button>
                .
              </div>
            )}
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{copy.valueMinutes}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{copy.valueAnywhere}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{copy.valueVerified}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{copy.valueInstant}</span>
            </div>
          </div>
        </div>

        {/* Featured Doctors */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-heading font-bold">
              {searchQuery ? copy.searchResults : copy.featuredDoctors}
            </h2>
            {doctors.length > 0 && (
              <p className="text-muted-foreground">
                {doctors.length} {doctors.length === 1 ? copy.doctorSingular : copy.doctorPlural}
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{copy.searchingDoctors}</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card className="border-border/50 shadow-lg">
              <CardContent className="py-12 text-center">
                <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">{copy.noDoctorsFound}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor, idx) => (
                <Card 
                  key={doctor.id} 
                  data-testid={`featured-doctor-card-${idx}`}
                  className="hover-lift border-border/50 shadow-lg cursor-pointer"
                  onClick={handleContactDoctor}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                          {doctor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {doctor.is_verified && (
                        <Badge 
                          variant="default" 
                          className="rounded-full bg-green-100 text-green-700 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {copy.verified}
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
                        <Users className="w-4 h-4" />
                        <span>{doctor.total_patients || 0} {copy.patients}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {doctor.avg_response_minutes === null || doctor.avg_response_minutes === undefined
                            ? copy.noData
                            : doctor.avg_response_minutes < 1
                              ? '<1 min'
                              : doctor.avg_response_minutes < 60
                                ? `${doctor.avg_response_minutes} min`
                                : `${Math.round(doctor.avg_response_minutes / 60)} h`}
                        </span>
                      </div>
                    </div>

                    <Button
                      data-testid={`contact-featured-doctor-button-${idx}`}
                      onClick={handleContactDoctor}
                      className="w-full rounded-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {copy.contactNow}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-heading font-bold text-center mb-12">
            {copy.howItWorks}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border/50 shadow-lg text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{copy.step1Title}</h3>
                <p className="text-muted-foreground">
                  {copy.step1Description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{copy.step2Title}</h3>
                <p className="text-muted-foreground">
                  {copy.step2Description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{copy.step3Title}</h3>
                <p className="text-muted-foreground">
                  {copy.step3Description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {copy.ctaTitle}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {copy.ctaDescription}
          </p>
          <Button 
            data-testid="cta-get-started-button"
            onClick={onShowAuth}
            size="lg"
            className="rounded-full px-12 h-14 text-lg"
          >
            {copy.ctaButton}
          </Button>
        </div>
      </section>
    </div>
  );
}
