import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Bell,
  User,
  Settings
 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { canDelete, loading: roleLoading, isMaster } = useUserRole();
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<any[]>([]);
  const [stats, setStats] = useState({
    processosAtivos: 0,
    audienciasHoje: 0,
    clientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Recarregar dados quando a página receber foco
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const loadData = async () => {
    try {
      // Carregar processos com dados do cliente
      const { data: processosData, error: processosError } = await supabase
        .from('processos')
        .select(`
          *,
          clientes (
            nome
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (processosError) {
        console.error('Erro ao carregar processos:', processosError);
        throw processosError;
      }

      console.log('Processos carregados:', processosData);
      setProcessos(processosData || []);
      
      // Contar clientes únicos
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user?.id);

      if (clientesError) throw clientesError;
      
      // Atualizar estatísticas
      setStats({
        processosAtivos: processosData?.length || 0,
        audienciasHoje: 0,
        clientes: clientesData?.length || 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProcesso = (processoId: string) => {
    // Agora vai para a página de visualização
    window.location.href = `/processo/${processoId}`;
  };

  const handleDeleteProcesso = async (processoId: string) => {
    if (confirm('Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase
          .from('processos')
          .delete()
          .eq('id', processoId);

        if (error) throw error;

        // Recarregar dados
        loadData();
      } catch (error) {
        console.error('Erro ao excluir processo:', error);
        alert('Erro ao excluir processo');
      }
    }
  };

  const statsData = [
    {
      title: "Processos Ativos",
      value: stats.processosAtivos.toString(),
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Audiências Hoje", 
      value: stats.audienciasHoje.toString(),
      icon: Calendar,
      color: "text-success"
    },
    {
      title: "Clientes",
      value: stats.clientes.toString(), 
      icon: Users,
      color: "text-purple"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary">FacilitaAdv</h1>
            <span className="text-muted-foreground">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 bg-success text-success-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {stats.processosAtivos}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.email?.split('@')[0] || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground">Advogado</span>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/novo-processo")}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Plus className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-semibold">Novo Processo</h3>
              <p className="text-sm text-muted-foreground">Criar processo judicial</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/ia-facilita")}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="font-semibold">IA Facilita</h3>
              <p className="text-sm text-muted-foreground">Assistente inteligente</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/facilisign")}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="font-semibold">FaciliSign</h3>
              <p className="text-sm text-muted-foreground">Assinatura digital</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/google-integration")}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Calendar className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="font-semibold">Google</h3>
              <p className="text-sm text-muted-foreground">Integrações Google</p>
            </CardContent>
          </Card>

          {/* Always show the Users card for now - will be conditional later */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/user-management")}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="font-semibold">Gerenciar Usuários</h3>
              <p className="text-sm text-muted-foreground">Cadastrar e gerenciar usuários</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/novo-processo'}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
          <Button variant="success" onClick={() => window.location.href = '/financeiro'}>
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.location.href = '/facilisign'}>
            FaciliSign ID
          </Button>
          <Button variant="purple" onClick={() => window.location.href = '/ia-facilita'}>
            IA-Facilita
          </Button>
          <Button variant="outline" className="border-google text-google hover:bg-google hover:text-white" onClick={() => window.location.href = '/google-integration'}>
            <Settings className="w-4 h-4 mr-2" />
            Integração Google
          </Button>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => window.location.href = '/calendar'}>
            <Calendar className="w-4 h-4 mr-2" />
            Agenda
          </Button>
        </div>

        {/* Processes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Processos
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar processos ativos..."
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Active Processes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Processos Ativos</CardTitle>
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar processos ativos..."
                  className="pl-10 w-80"
                />
              </div>
              <span className="text-sm text-muted-foreground">{processos.length} processo(s) ativo(s)</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : processos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum processo cadastrado. Clique em "Novo Processo" para começar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AÇÕES</TableHead>
                    <TableHead>Nº PROCESSO</TableHead>
                    <TableHead>CLIENTE</TableHead>
                    <TableHead>TIPO DO PROCESSO</TableHead>
                    <TableHead>CLIENTE PRESO</TableHead>
                    <TableHead>PRAZO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((processo) => (
                    <TableRow key={processo.id}>
                       <TableCell>
                         <div className="flex gap-2">
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => handleEditProcesso(processo.id)}
                           >
                             <Edit className="w-4 h-4 text-success" />
                           </Button>
                           {canDelete() && (
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => handleDeleteProcesso(processo.id)}
                             >
                               <Trash2 className="w-4 h-4 text-warning" />
                             </Button>
                           )}
                         </div>
                       </TableCell>
                      <TableCell className="font-mono">{processo.numero_processo}</TableCell>
                      <TableCell>{processo.clientes?.nome || 'Cliente não encontrado'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {processo.tipo_processo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={processo.cliente_preso ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}>
                          {processo.cliente_preso ? "SIM" : "NÃO"}
                        </Badge>
                      </TableCell>
                      <TableCell>{processo.prazo ? new Date(processo.prazo).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;