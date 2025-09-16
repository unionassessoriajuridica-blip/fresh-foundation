import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { usePermissions } from "@/hooks/usePermissions.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  canViewAllProcesses,
  canViewAllFinancial,
  useGlobalAccess,
} from "@/utils/accessUtils.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
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
  Settings,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useNavigate } from "react-router-dom";
import { ClienteDataButton } from "@/components/ClienteDataButton.tsx";
import Swal from "sweetalert2";
declare global {
  interface Window {
    __debugPermissions?: {
      permissions: string[];
      hasPermission: (perm: string) => boolean;
      userId: string | undefined;
    };
  }
}
const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    hasPermission,
    permissions,
    loading: permissionsLoading,
  } = usePermissions();

  const { isMaster, isAdmin } = useUserRole();
  const [processos, setProcessos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const [stats, setStats] = useState({
    processosAtivos: 0,
    audienciasHoje: 0,
    clientes: 0,
  });
  const [loading, setLoading] = useState(true);

  const {
    canViewAllProcesses: hasGlobalProcessAccess,
    canViewAllFinancial: hasGlobalFinancialAccess,
    canViewAllClients: hasGlobalClientAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();

  useEffect(() => {
    console.log("=== DEBUG GLOBAL ACCESS ===");
    console.log("hasGlobalProcessAccess:", hasGlobalProcessAccess);
    console.log("hasGlobalClientAccess:", hasGlobalClientAccess);
    console.log("hasGlobalFinancialAccess:", hasGlobalFinancialAccess);
    console.log("globalAccessLoading:", globalAccessLoading);
  }, [
    hasGlobalProcessAccess,
    hasGlobalClientAccess,
    hasGlobalFinancialAccess,
    globalAccessLoading,
  ]);

  useEffect(() => {
    console.log("=== DEBUG PERMISSÕES ===");
    console.log("User ID:", user?.id);
    console.log("Todas as permissões:", permissions);
    console.log("Tem facilisign?", hasPermission("facilisign"));
    console.log("Tem user_management?", hasPermission("user_management"));
    console.log("Tem google_integration?", hasPermission("google_integration"));
    console.log("Tem financeiro?", hasPermission("financeiro"));
    console.log("Tem agenda?", hasPermission("agenda"));
    console.log("Tem ia_facilita?", hasPermission("ia_facilita"));
    window.__debugPermissions = {
      permissions,
      hasPermission: (perm: string) => permissions.includes(perm),
      userId: user?.id,
    };
    console.log("Debug permissions exposed:", window.__debugPermissions);
  }, [permissions, hasPermission, user]);

  const filteredProcessos = processos.filter((processo) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      processo.numero_processo?.toLowerCase().includes(term) ||
      processo.clientes?.nome?.toLowerCase().includes(term) ||
      processo.tipo_processo?.toLowerCase().includes(term)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProcessos = filteredProcessos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProcessos.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // DEBUG URGENTE
  useEffect(() => {
    console.log("=== 🚨 DEBUG URGENTE 🚨 ===");
    console.log("User ID:", user?.id);
    console.log("Todas Permissões:", permissions);
    console.log(
      "Tem 'ver_todos_processos':",
      permissions.includes("ver_todos_processos")
    );
    console.log("Tem 'ADMIN':", permissions.includes("ADMIN"));
    console.log("hasGlobalProcessAccess:", hasGlobalProcessAccess);
    console.log("hasGlobalFinancialAccess:", hasGlobalFinancialAccess);
    console.log("hasGlobalClientAccess:", hasGlobalClientAccess);
  }, [permissions, hasGlobalProcessAccess, user]);

  // DEBUG da Query
  console.log("=== 🔍 QUERY DEBUG ===");
  console.log("Vai aplicar filtro?", !hasGlobalProcessAccess);
  console.log("User ID para filtro:", user?.id);

  useEffect(() => {
    if (user && !permissionsLoading && !globalAccessLoading) {
      loadData();
    }
  }, [user, permissionsLoading, globalAccessLoading]);

  const loadData = async () => {
    console.log("=== 🔍 INICIANDO CARREGAMENTO ===");

    try {
      // Primeiro, teste se a tabela processos existe
      const { data: testData, error: testError } = await supabase
        .from("processos")
        .select("count")
        .limit(1);

      if (testError) {
        console.error("❌ ERRO: Tabela processos não encontrada:", testError);
        return;
      }

      console.log("✅ Tabela processos encontrada");

      // Agora faça a query completa
      let processosQuery = supabase
        .from("processos")
        .select(
          `
        *,
        clientes (nome)
      `
        )
        .order("created_at", { ascending: false });

      if (!hasGlobalProcessAccess && user?.id) {
        console.log("🔍 Filtrando por user_id:", user.id);
        processosQuery = processosQuery.eq("user_id", user.id);
      }

      const { data: processosData, error: processosError } =
        await processosQuery;

      if (processosError) {
        console.error("❌ Erro na query:", processosError);
        return;
      }

      await loadStats();

      console.log("✅ Processos carregados:", processosData);
      setProcessos(processosData || []);
    } catch (error) {
      console.error("❌ Erro geral:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Contar processos ativos
      let processosCountQuery = supabase
        .from("processos")
        .select("id", { count: "exact" })
        .eq("status", "ATIVO");

      if (!hasGlobalProcessAccess && user?.id) {
        processosCountQuery = processosCountQuery.eq("user_id", user.id);
      }

      const { count: processosAtivos, error: processosError } =
        await processosCountQuery;

      // Contar clientes
      let clientesQuery = supabase
        .from("clientes")
        .select("id", { count: "exact" });

      if (!hasGlobalClientAccess && user?.id) {
        clientesQuery = clientesQuery.eq("user_id", user.id);
      }

      const { count: clientes, error: clientesError } = await clientesQuery;

      // Contar audiências para hoje (assumindo que audiências estão na tabela processos com campo prazo)
      const hoje = new Date().toISOString().split("T")[0];

      let audienciasQuery = supabase
        .from("processos")
        .select("id", { count: "exact" })
        .eq("prazo", hoje);

      if (!hasGlobalProcessAccess && user?.id) {
        audienciasQuery = audienciasQuery.eq("user_id", user.id);
      }

      const { count: audienciasHoje, error: audienciasError } =
        await audienciasQuery;

      // Atualizar estatísticas
      setStats({
        processosAtivos: processosAtivos || 0,
        clientes: clientes || 0,
        audienciasHoje: audienciasHoje || 0,
      });

      console.log("✅ Estatísticas carregadas:", {
        processosAtivos,
        clientes,
        audienciasHoje,
      });
    } catch (error) {
      console.error("❌ Erro ao carregar estatísticas:", error);
      // Definir valores padrão em caso de erro
      setStats({
        processosAtivos: 0,
        clientes: 0,
        audienciasHoje: 0,
      });
    }
  };

  const handleEditProcesso = (processoId: string, processoUserId: string) => {
    // 🔥 CORREÇÃO: Permitir editar se tem acesso GLOBAL ou se é o dono
    if (hasGlobalProcessAccess || processoUserId === user?.id) {
      navigate(`/processo/${processoId}`);
    } else {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar este processo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProcesso = async (processoId: string) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!hasGlobalProcessAccess && processoUserId !== user?.id) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir este processo",
        variant: "destructive",
      });
      return;
    }

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("processos")
          .delete()
          .eq("id", processoId);

        if (error) throw error;

        Swal.fire(
          "Excluído!",
          "O processo foi excluído com sucesso.",
          "success"
        );

        loadData();
      } catch (error) {
        console.error("Erro ao excluir processo:", error);
        Swal.fire("Erro!", "Ocorreu um erro ao excluir o processo.", "error");
      }
    }
  };

  // Função para formatar a data corretamente (resolvendo o problema do -1 dia)
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    // Adiciona um dia para corrigir o problema do fuso horário
    date.setDate(date.getDate() + 1);

    return date.toLocaleDateString("pt-BR");
  };

  // Função para determinar a cor com base na proximidade do prazo
  const getPrazoColor = (prazo: string) => {
    if (!prazo) return "default";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataPrazo = new Date(prazo);
    dataPrazo.setHours(0, 0, 0, 0);

    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "destructive"; // Vencido - vermelho
    } else if (diffDays === 0) {
      return "destructive"; // Vence hoje - também vermelho
    } else if (diffDays <= 5) {
      return "warning"; // 5 dias ou menos - laranja
    } else {
      return "success"; // Em dia - verde
    }
  };

  // Função para obter o texto descritivo do prazo
  const getPrazoText = (prazo: string) => {
    if (!prazo) return "-";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataPrazo = new Date(prazo);
    dataPrazo.setHours(0, 0, 0, 0);

    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencido há ${Math.abs(diffDays)} dia(s)`;
    } else if (diffDays === 0) {
      return "Vence hoje";
    } else if (diffDays === 1) {
      return "Vence amanhã";
    } else {
      return `Vence em ${diffDays} dias`;
    }
  };

  // Função para determinar a classe CSS da linha com base no prazo
  const getRowClassName = (prazo: string) => {
    const color = getPrazoColor(prazo);

    if (color === "destructive") {
      return "bg-destructive/10 hover:bg-destructive/20"; // Vermelho para vencidos
    } else if (color === "warning") {
      return "bg-warning/10 hover:bg-warning/20"; // Laranja para próximos
    }

    return ""; // Sem cor especial para em dia
  };

  const statsData = [
    {
      title: "Processos Ativos",
      value: stats.processosAtivos.toString(),
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Audiências Hoje",
      value: stats.audienciasHoje.toString(),
      icon: Calendar,
      color: "text-success",
    },
    {
      title: "Clientes",
      value: stats.clientes.toString(),
      icon: Users,
      color: "text-purple",
    },
  ];

  if (permissionsLoading || globalAccessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary">
              <img
                src="/img/logosite.png"
                alt="FacilitaAdv Logo"
                className="h-10"
              />
            </h1>
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
                <span className="text-sm font-medium">
                  {user?.email?.split("@")[0] || "Usuário"}
                </span>
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
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
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
          {hasPermission("novo_processo") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/novo-processo")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Plus className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold">Novo Processo</h3>
                <p className="text-sm text-muted-foreground">
                  Criar processo judicial
                </p>
              </CardContent>
            </Card>
          )}
          
          {hasPermission("financeiro") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/whatsapp")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Enviar cobranças e gerenciar conexão
                </p>
              </CardContent>
            </Card>
          )}
          {hasPermission("ia_facilita") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/ia-facilita")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="font-semibold">IA Facilita</h3>
                <p className="text-sm text-muted-foreground">
                  Assistente inteligente
                </p>
              </CardContent>
            </Card>
          )}
          {hasPermission("facilisign") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/facilisign")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="font-semibold">FaciliSign</h3>
                <p className="text-sm text-muted-foreground">
                  Assinatura digital
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission("google_integration") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/google-integration")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Calendar className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="font-semibold">Google</h3>
                <p className="text-sm text-muted-foreground">
                  Integrações Google
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission("user_management") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/user-management")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="font-semibold">Gerenciar Usuários</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastrar e gerenciar usuários
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission("financeiro") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/financeiro")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <DollarSign className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="font-semibold">Financeiro</h3>
                <p className="text-sm text-muted-foreground">
                  Gestão financeira
                </p>
              </CardContent>
            </Card>
          )}

          {hasPermission("agenda") && (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/calendar")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Calendar className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="font-semibold">Agenda</h3>
                <p className="text-sm text-muted-foreground">
                  Gestão de compromissos
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {hasPermission("novo_processo") && (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/novo-processo")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          )}

          {hasPermission("financeiro") && (
            <Button variant="success" onClick={() => navigate("/financeiro")}>
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </Button>
          )}

          {hasPermission("facilisign") && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => navigate("/facilisign")}
            >
              FaciliSign ID
            </Button>
          )}

          {hasPermission("ia_facilita") && (
            <Button variant="purple" onClick={() => navigate("/ia-facilita")}>
              IA-Facilita
            </Button>
          )}

          {hasPermission("google_integration") && (
            <Button
              variant="outline"
              className="border-google text-google hover:bg-google hover:text-white"
              onClick={() => navigate("/google-integration")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Integração Google
            </Button>
          )}

          {hasPermission("agenda") && (
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => navigate("/calendar")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agenda
            </Button>
          )}

          <ClienteDataButton />
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
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
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
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {processos.length} processo(s) ativo(s)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">
                Carregando...
              </p>
            ) : processos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum processo cadastrado. Clique em "Novo Processo" para
                começar.
              </p>
            ) : (
              <>
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
                    {currentProcessos.map((processo) => (
                      <TableRow
                        key={processo.id}
                        className={getRowClassName(processo.prazo)}
                      >
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProcesso(processo.id)}
                            >
                              <Edit className="w-4 h-4 text-success" />
                            </Button>
                            {hasPermission("excluir_processo") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeleteProcesso(processo.id)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {processo.numero_processo}
                        </TableCell>
                        <TableCell>
                          {processo.clientes?.nome || "Cliente não encontrado"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {processo.tipo_processo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              processo.cliente_preso
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-success/10 text-success border-success/20"
                            }
                          >
                            {processo.cliente_preso ? "SIM" : "NÃO"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {processo.prazo ? (
                            <div className="flex flex-col">
                              <Badge
                                className={`
                                  w-fit mb-1 
                                  ${
                                    getPrazoColor(processo.prazo) ===
                                    "destructive"
                                      ? "bg-destructive text-destructive-foreground"
                                      : ""
                                  }
                                  ${
                                    getPrazoColor(processo.prazo) === "warning"
                                      ? "bg-amber-500 text-amber-50"
                                      : ""
                                  }
                                  ${
                                    getPrazoColor(processo.prazo) === "success"
                                      ? "bg-green-500 text-green-50"
                                      : ""
                                  }
                                `}
                              >
                                {getPrazoColor(processo.prazo) ===
                                  "destructive" && "Vencido"}
                                {getPrazoColor(processo.prazo) === "warning" &&
                                  "Próximo"}
                                {getPrazoColor(processo.prazo) === "success" &&
                                  "Em dia"}
                              </Badge>
                              <div className="text-sm">
                                {formatDate(processo.prazo)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getPrazoText(processo.prazo)}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Controles de paginação */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
