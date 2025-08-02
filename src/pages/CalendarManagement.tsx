import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Plus } from 'lucide-react';
import { GoogleCalendarCard } from '@/components/GoogleCalendarCard';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const CalendarManagement = () => {
  const navigate = useNavigate();

  // Configuração real do Google OAuth
  const googleAuth = useGoogleAuth({
    clientId: '539033439477-ffopqgv56a9qvp52d8gnmmfg6hcrmb8l.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar'
    ]
  });

  const handleConnectGoogle = async () => {
    await googleAuth.signIn();
  };

  const handleDisconnectGoogle = async () => {
    await googleAuth.signOut();
  };

  const upcomingEvents = [
    {
      id: '1',
      title: 'Audiência - Processo 0001234-56.2024.8.26.0100',
      date: '15/12/2024',
      time: '14:00',
      type: 'Audiência',
      location: 'Fórum Central'
    },
    {
      id: '2',
      title: 'Reunião com Cliente - Mayara Fernandes',
      date: '18/12/2024', 
      time: '10:00',
      type: 'Reunião',
      location: 'Escritório'
    },
    {
      id: '3',
      title: 'Prazo Recurso - Processo Criminal',
      date: '20/12/2024',
      time: '18:00',
      type: 'Prazo',
      location: 'Online'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Gestão de Agenda</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Google Calendar Integration */}
          <div className="lg:col-span-2">
            <GoogleCalendarCard
              isConnected={googleAuth.isAuthenticated}
              onConnect={handleConnectGoogle}
              onDisconnect={handleDisconnectGoogle}
            />
          </div>

          {/* Quick Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Resumo da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-xs text-blue-600">Audiências</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-xs text-green-600">Reuniões</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">2</div>
                    <div className="text-xs text-orange-600">Prazos</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">1</div>
                    <div className="text-xs text-purple-600">Outros</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Próximos Eventos</h4>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs text-center min-w-[45px]">
                          <div className="font-medium">{event.date.split('/')[0]}</div>
                          <div className="text-muted-foreground">
                            {event.date.split('/')[1]}/{event.date.split('/')[2].slice(-2)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.title}</div>
                          <div className="text-xs text-muted-foreground">{event.time} - {event.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Audiência
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Reunião
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Definir Prazo
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Dicas de Produtividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Configurar Lembretes</p>
                    <p className="text-blue-600 mt-1">Configure lembretes automáticos para não perder prazos importantes.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">Sincronização Automática</p>
                    <p className="text-green-600 mt-1">Eventos criados no sistema são automaticamente sincronizados com o Google Calendar.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarManagement;