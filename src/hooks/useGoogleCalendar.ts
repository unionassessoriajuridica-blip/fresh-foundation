import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  type: 'audiencia' | 'reuniao' | 'prazo' | 'outros';
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface CreateEventParams {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  timeZone?: string;
}

export const useGoogleCalendar = (accessToken: string | null) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadEvents = async (calendarId: string = 'primary') => {
    if (!accessToken) {
      toast({
        title: "Erro",
        description: "Token de acesso não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // próximos 30 dias

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const formattedEvents: CalendarEvent[] = data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary || 'Sem título',
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        location: item.location,
        attendees: item.attendees?.map((attendee: any) => attendee.email) || [],
        type: getEventType(item.summary || ''),
        status: item.status || 'confirmed'
      })) || [];

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos do Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: CreateEventParams, calendarId: string = 'primary') => {
    if (!accessToken) {
      toast({
        title: "Erro",
        description: "Token de acesso não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.start,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        },
        end: {
          dateTime: eventData.end,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        },
        attendees: eventData.attendees?.map(email => ({ email })) || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 }, // 30 minutos antes
          ],
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      
      toast({
        title: "Sucesso",
        description: "Evento criado e sincronizado com Google Calendar.",
      });

      // Recarregar eventos
      await loadEvents(calendarId);
      
      return createdEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento no Google Calendar.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEvent = async (eventId: string, calendarId: string = 'primary') => {
    if (!accessToken) {
      toast({
        title: "Erro",
        description: "Token de acesso não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Sucesso",
        description: "Evento removido do Google Calendar.",
      });

      // Recarregar eventos
      await loadEvents(calendarId);
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o evento do Google Calendar.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getEventType = (summary: string): CalendarEvent['type'] => {
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('audiencia') || lowerSummary.includes('audiência')) return 'audiencia';
    if (lowerSummary.includes('reuniao') || lowerSummary.includes('reunião')) return 'reuniao';
    if (lowerSummary.includes('prazo')) return 'prazo';
    return 'outros';
  };

  return {
    events,
    loading,
    loadEvents,
    createEvent,
    deleteEvent
  };
};