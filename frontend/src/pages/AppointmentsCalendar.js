import React, { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Clock3, CalendarDays, Video, Stethoscope } from 'lucide-react';

const DEMO_TODAY = new Date(2026, 1, 20, 12, 0, 0);
const DEMO_MONTH = new Date(2026, 1, 1, 12, 0, 0);

const EVENTS = [
  {
    id: 'ev-1',
    date: new Date(2026, 1, 20, 12, 0, 0),
    time: '09:30',
    title: 'Control de seguimiento',
    mode: 'Videollamada',
  },
  {
    id: 'ev-2',
    date: new Date(2026, 1, 20, 12, 0, 0),
    time: '13:00',
    title: 'Primera consulta',
    mode: 'Presencial',
  },
  {
    id: 'ev-3',
    date: new Date(2026, 1, 22, 12, 0, 0),
    time: '11:00',
    title: 'Revisión de estudios',
    mode: 'Videollamada',
  },
];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateLabel(date) {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AppointmentsCalendar({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [month, setMonth] = useState(DEMO_MONTH);

  const selectedEvents = useMemo(
    () => EVENTS.filter((event) => isSameDay(event.date, selectedDate)),
    [selectedDate]
  );

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
              Calendario de Consultas
            </h1>
            <p className="text-muted-foreground text-lg">
              Agenda mensual de citas médicas y videollamadas.
            </p>
          </div>
          <Badge className="rounded-full px-3 py-1.5">
            <CalendarDays className="w-4 h-4 mr-2" />
            Hoy: 20 de febrero de 2026
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Febrero 2026</CardTitle>
              <CardDescription>Selecciona un día para ver el detalle de citas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border p-4 w-fit bg-background">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={month}
                  onMonthChange={setMonth}
                  defaultMonth={DEMO_MONTH}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Agenda del día</CardTitle>
              <CardDescription className="capitalize">{formatDateLabel(selectedDate)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground rounded-xl border border-border p-4">
                  No hay consultas programadas para esta fecha.
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-border p-4 bg-secondary/20">
                    <p className="font-semibold">{event.title}</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4" />
                        {event.time}
                      </p>
                      <p className="flex items-center gap-2">
                        {event.mode === 'Videollamada' ? <Video className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                        {event.mode}
                      </p>
                    </div>
                  </div>
                ))
              )}

              <Button type="button" className="w-full rounded-full">
                Crear nueva consulta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
