import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/currency";
import ParcelaCard from "@/components/ParcelaCard";
import FinanceiroSummary from "@/components/FinanceiroSummary";
import { FinancialReports } from "@/components/FinancialReports";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ResponsavelFinanceiro } from "@/components/ResponsavelFinanceiro";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinanceiroItem {
  id: string;
  cliente_nome: string;
  valor: number;
  tipo: string;
  status: string;
  vencimento: string;
  data_pagamento?: string;
  created_at: string;
}

const Financial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([]);
  const [clientes, setClientes] = useState<{nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroMes, setFiltroMes] = useState<string>('TODOS');
  const [filtroCliente, setFiltroCliente] = useState<string>('TODOS');

  useEffect(() => {
    if (user) {
      fetchFinanceiro();
      fetchClientes();
    }
  }, [user]);

  const fetchFinanceiro = async () => {
    try {
      const { data, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('user_id', user?.id)
        .order('vencimento', { ascending: true });

      if (error) throw error;
      console.log('Dados financeiros carregados:', data);
      setFinanceiro(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados financeiros",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('nome')
        .eq('user_id', user?.id)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleBaixaPagamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financeiro')
        .update({
          status: 'PAGO',
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Pagamento registrado!",
        description: "A baixa do pagamento foi realizada com sucesso.",
      });

      fetchFinanceiro();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar pagamento",
        description: error.message,
      });
    }
  };

  const filteredData = financeiro.filter(item => {
    const statusMatch = filtroStatus === 'TODOS' || item.status === filtroStatus;
    const tipoMatch = filtroTipo === 'TODOS' || item.tipo === filtroTipo;
    const clienteMatch = filtroCliente === 'TODOS' || item.cliente_nome === filtroCliente;
    
    // Filtro por mês
    let mesMatch = true;
    if (filtroMes !== 'TODOS') {
      const vencimentoDate = new Date(item.vencimento);
      const mesVencimento = vencimentoDate.getMonth() + 1;
      const anoVencimento = vencimentoDate.getFullYear();
      const anoAtual = new Date().getFullYear();
      
      const [mesFiltro, anoFiltro] = filtroMes.split('-').map(Number);
      mesMatch = mesVencimento === mesFiltro && anoVencimento === (anoFiltro || anoAtual);
    }
    
    return statusMatch && tipoMatch && clienteMatch && mesMatch;
  });

  const isVencido = (vencimento: string, status: string) => {
    if (status === 'PAGO') return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const totais = {
    pendente: financeiro.filter(item => item.status === 'PENDENTE').reduce((sum, item) => sum + item.valor, 0),
    pago: financeiro.filter(item => item.status === 'PAGO').reduce((sum, item) => sum + item.valor, 0),
    vencido: financeiro.filter(item => isVencido(item.vencimento, item.status)).reduce((sum, item) => sum + item.valor, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Gestão Financeira</h1>
        </div>

        {/* Cards de Resumo usando o componente */}
        <FinanceiroSummary 
          totalPendente={totais.pendente}
          totalPago={totais.pago}
          totalVencido={totais.vencido}
        />

        <Tabs defaultValue="financeiro" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financeiro">Gestão Financeira</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios e Gráficos</TabsTrigger>
            <TabsTrigger value="responsavel">Responsável Financeiro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financeiro" className="space-y-6">
            {/* Notificações de Parcelas em Aberto */}
            <NotificationCenter />
            
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status:</label>
                    <select 
                      value={filtroStatus} 
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo:</label>
                    <select 
                      value={filtroTipo} 
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="Honorários">Honorários</option>
                      <option value="Entrada">Entrada</option>
                      <option value="TMP">TMP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Mês:</label>
                    <select 
                      value={filtroMes} 
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Cliente:</label>
                    <select 
                      value={filtroCliente} 
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.nome} value={cliente.nome}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pagamentos Agrupados por Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Clientes e Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro financeiro encontrado.</p>
                  </div>
                ) : (
                  (() => {
                    // Agrupar por cliente
                    const clientesUnicos = [...new Set(filteredData.map(item => item.cliente_nome))];
                    console.log('Clientes únicos encontrados:', clientesUnicos);
                    
                    return (
                      <div className="space-y-6">
                        {clientesUnicos.map((cliente) => {
                          const parcelasCliente = filteredData.filter(item => item.cliente_nome === cliente);
                          const totalPendente = parcelasCliente.filter(item => item.status === 'PENDENTE').reduce((sum, item) => sum + item.valor, 0);
                          const totalPago = parcelasCliente.filter(item => item.status === 'PAGO').reduce((sum, item) => sum + item.valor, 0);
                          
                          return (
                            <div key={cliente} className="border rounded-lg p-6 bg-muted/30">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold">{cliente}</h3>
                                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                    <span>Total de parcelas: {parcelasCliente.length}</span>
                                    <span>Pendente: {formatCurrency(totalPendente)}</span>
                                    <span>Recebido: {formatCurrency(totalPago)}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      console.log('Navegando para cliente:', cliente);
                                      navigate(`/financeiro/cliente/${encodeURIComponent(cliente)}`);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Todas as Parcelas ({parcelasCliente.length})
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Mostrar próximas parcelas pendentes usando o componente ParcelaCard */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Próximos vencimentos:</h4>
                                {parcelasCliente
                                  .filter(item => item.status === 'PENDENTE')
                                  .slice(0, 3)
                                  .map((item) => (
                                    <ParcelaCard
                                      key={item.id}
                                      id={item.id}
                                      clienteNome={item.cliente_nome}
                                      valor={item.valor}
                                      tipo={item.tipo}
                                      status={item.status}
                                      vencimento={item.vencimento}
                                      dataPagamento={item.data_pagamento}
                                      onBaixaPagamento={handleBaixaPagamento}
                                      showClienteName={false}
                                    />
                                  ))}
                                
                                {parcelasCliente.filter(item => item.status === 'PENDENTE').length > 3 && (
                                  <div className="text-center pt-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => navigate(`/financeiro/cliente/${encodeURIComponent(cliente)}`)}
                                    >
                                      Ver mais {parcelasCliente.filter(item => item.status === 'PENDENTE').length - 3} parcelas pendentes...
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="relatorios">
            <FinancialReports financeiro={financeiro} />
          </TabsContent>
          
          <TabsContent value="responsavel">
            <ResponsavelFinanceiro />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Financial;