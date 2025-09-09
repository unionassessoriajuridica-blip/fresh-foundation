import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ArrowLeft,
  Edit,
  User,
  DollarSign,
  FileText,
  Users,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { usePermissions } from "@/hooks/usePermissions.ts";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

const ProcessView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processo, setProcesso] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [financeiro, setFinanceiro] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [responsavel, setResponsavel] = useState<any>(null);
 
  const {
    canViewAllProcesses: hasGlobalProcessAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();

  const {
    loading: permissionsLoading,
  } = usePermissions();

  useEffect(() => {
    if (id && user && !permissionsLoading && !globalAccessLoading) {
      loadProcessData();
    }
  }, [id, user, permissionsLoading, globalAccessLoading]);

  const loadProcessData = async () => {
    try {
      setLoading(true);

      console.log("=== DEBUG PROCESS VIEW ===");
      console.log("Tem acesso global a processos:", hasGlobalProcessAccess);
      console.log("User ID:", user?.id);

      let processoQuery = supabase
        .from("processos")
        .select(
          `
          *,
          clientes (*)
        `
        )
        .eq("id", id);

      if (!hasGlobalProcessAccess) {
        console.log("Aplicando filtro por user_id");
        processoQuery = processoQuery.eq("user_id", user?.id);
      } else {
        console.log("Visualizando todos os processos (acesso global)");
      }

      const { data: processoData, error: processoError } =
        await processoQuery.single();

      if (processoError) {
        console.error("Erro ao carregar processo:", processoError);
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "Processo não encontrado ou você não tem permissão para acessá-lo.",
        });
        navigate("/dashboard");
        return;
      }

      setProcesso(processoData);
      setCliente(processoData.clientes);

      // Carregar dados financeiros
      const { data: financeiroData, error: financeiroError } = await supabase
        .from("financeiro")
        .select("*")
        .eq("cliente_nome", processoData.clientes?.nome)
        .order("created_at", { ascending: true });

      if (!financeiroError && financeiroData) {
        setFinanceiro(financeiroData);
      }

      // Carregar observações
      const { data: observacoesData, error: observacoesError } = await supabase
        .from("observacoes_processo")
        .select("*")
        .eq("processo_id", id);

      if (!observacoesError && observacoesData) {
        setObservacoes(observacoesData);
      }

      // Carregar documentos
      const { data: documentosData, error: documentosError } = await supabase
        .from("documentos_processo")
        .select("*")
        .eq("processo_id", id);

      if (!documentosError && documentosData) {
        setDocumentos(documentosData);
      }

      // Carregar responsável financeiro
      const { data: responsavelData, error: responsavelError } = await supabase
        .from("responsavel_financeiro")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!responsavelError && responsavelData && responsavelData.length > 0) {
        setResponsavel(responsavelData[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do processo:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do processo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    financeiroId: string,
    novoStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("financeiro")
        .update({
          status: novoStatus,
          data_pagamento:
            novoStatus === "PAGO"
              ? new Date().toISOString().split("T")[0]
              : null,
        })
        .eq("id", financeiroId);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao atualizar status do pagamento.",
        });
        return;
      }

      // Atualizar estado local
      setFinanceiro((prevFinanceiro) =>
        prevFinanceiro.map((item) =>
          item.id === financeiroId
            ? {
                ...item,
                status: novoStatus,
                data_pagamento:
                  novoStatus === "PAGO"
                    ? new Date().toISOString().split("T")[0]
                    : null,
              }
            : item
        )
      );

      toast({
        title: "Status atualizado!",
        description: `Pagamento marcado como ${novoStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status do pagamento.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando dados do processo...</p>
        </div>
      </div>
    );
  }

  if (!processo || !cliente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Processo não encontrado
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dados do Cliente</h1>
              <p className="text-muted-foreground">{cliente.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}`)}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=2`)}
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Dados do Processo
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=3`)}
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Configuração Financeira
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=4`)}
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Configuração Anexos
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="dados-pessoais"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Dados Pessoais
                </TabsTrigger>
                <TabsTrigger
                  value="financeiro"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Financeiro ({financeiro.length})
                </TabsTrigger>
                <TabsTrigger
                  value="responsavel"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Responsável Financeiro
                </TabsTrigger>
                <TabsTrigger
                  value="arquivos"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Arquivos ({documentos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados-pessoais" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Nome Completo
                        </label>
                        <p className="text-base font-medium">{cliente.nome}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          CPF
                        </label>
                        <p className="text-base">{cliente.cpf_cnpj || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Telefone
                        </label>
                        <p className="text-base">{cliente.telefone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          E-mail
                        </label>
                        <p className="text-base">{cliente.email || "-"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Endereço
                        </label>
                        <p className="text-base">{cliente.endereco || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Dados do Processo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Número do Processo
                        </label>
                        <p className="text-base font-mono">
                          {processo.numero_processo}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Tipo do Processo
                        </label>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          {processo.tipo_processo}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Cliente Preso
                        </label>
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
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Prazo
                        </label>
                        <p className="text-base">
                          {processo.prazo ? formatDate(processo.prazo) : "-"}
                        </p>
                      </div>
                      {processo.descricao && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Descrição
                          </label>
                          <p className="text-base">{processo.descricao}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {observacoes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Observações
                      </h3>
                      <div className="space-y-4">
                        {observacoes.map((obs, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {obs.titulo}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {obs.conteudo}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    Informações Financeiras
                  </h3>

                  {financeiro.length > 0 ? (
                    <div className="space-y-4">
                      {["Entrada", "Honorários", "TMP"].map((tipo) => {
                        const itens = financeiro.filter((f) => f.tipo === tipo);
                        if (itens.length === 0) return null;

                        return (
                          <div key={tipo}>
                            <h4 className="font-medium text-base mb-3">
                              {tipo}
                            </h4>
                            <div className="grid gap-4">
                              {itens.map((item, index) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {formatCurrency(Number(item.valor))}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Vencimento:{" "}
                                          {formatDate(item.vencimento)}
                                        </p>
                                        {item.data_pagamento && (
                                          <p className="text-sm text-success">
                                            Pago em:{" "}
                                            {formatDate(item.data_pagamento)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={
                                            item.status === "PAGO"
                                              ? "bg-success/10 text-success border-success/20"
                                              : "bg-warning/10 text-warning border-warning/20"
                                          }
                                        >
                                          {item.status}
                                        </Badge>
                                        {item.status === "PENDENTE" ? (
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleStatusChange(
                                                item.id,
                                                "PAGO"
                                              )
                                            }
                                            className="bg-success hover:bg-success/90"
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            Dar Baixa
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleStatusChange(
                                                item.id,
                                                "PENDENTE"
                                              )
                                            }
                                            className="border-warning text-warning hover:bg-warning/10"
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancelar Baixa
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhuma informação financeira cadastrada.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="responsavel" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    Responsável Financeiro
                  </h3>

                  {responsavel ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Nome
                        </label>
                        <p className="text-base">{responsavel.nome}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          CPF
                        </label>
                        <p className="text-base">{responsavel.cpf}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          RG
                        </label>
                        <p className="text-base">{responsavel.rg || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Data de Nascimento
                        </label>
                        <p className="text-base">
                          {formatDate(responsavel.data_nascimento)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Telefone
                        </label>
                        <p className="text-base">{responsavel.telefone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          E-mail
                        </label>
                        <p className="text-base">{responsavel.email}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Endereço
                        </label>
                        <p className="text-base">
                          {responsavel.endereco_completo}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          CEP
                        </label>
                        <p className="text-base">{responsavel.cep}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhum responsável financeiro cadastrado.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="arquivos" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Arquivos</h3>

                  {documentos.length > 0 ? (
                    <div className="space-y-4">
                      {documentos.map((doc, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {doc.nome_arquivo}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Tipo: {doc.tipo_arquivo} • Tamanho:{" "}
                                  {(doc.tamanho_arquivo / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </p>
                                {doc.descricao && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {doc.descricao}
                                  </p>
                                )}
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={doc.url_arquivo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Visualizar
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhum arquivo anexado.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessView;
