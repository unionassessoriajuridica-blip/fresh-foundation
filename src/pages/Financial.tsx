import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, CheckCircle, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  useEffect(() => {
    if (user) {
      fetchFinanceiro();
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
      setFinanceiro(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados financeiros",
        description: error.message,
      });
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDENTE':
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PAGO':
        return 'default';
      case 'PENDENTE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Honorários':
        return 'bg-blue-100 text-blue-800';
      case 'Entrada':
        return 'bg-green-100 text-green-800';
      case 'TMP':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = financeiro.filter(item => {
    const statusMatch = filtroStatus === 'TODOS' || item.status === filtroStatus;
    const tipoMatch = filtroTipo === 'TODOS' || item.tipo === filtroTipo;
    return statusMatch && tipoMatch;
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

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totais.pendente)}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.pago)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totais.vencido)}</p>
                </div>
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status:</label>
                <select 
                  value={filtroStatus} 
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
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
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="TODOS">Todos</option>
                  <option value="Honorários">Honorários</option>
                  <option value="Entrada">Entrada</option>
                  <option value="TMP">TMP</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Parcelas e Pagamentos ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro financeiro encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      isVencido(item.vencimento, item.status) ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{item.cliente_nome}</span>
                          <Badge className={getTipoColor(item.tipo)}>
                            {item.tipo}
                          </Badge>
                          <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.status}
                          </Badge>
                          {isVencido(item.vencimento, item.status) && (
                            <Badge variant="destructive">VENCIDO</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Valor: <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span></p>
                          <p>Vencimento: <span className="font-medium text-foreground">
                            {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                          </span></p>
                          {item.data_pagamento && (
                            <p>Pago em: <span className="font-medium text-green-600">
                              {new Date(item.data_pagamento).toLocaleDateString('pt-BR')}
                            </span></p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.status === 'PENDENTE' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Dar Baixa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirma o recebimento de {formatCurrency(item.valor)} de {item.cliente_nome} ({item.tipo})?
                                  <br />
                                  <span className="text-sm text-muted-foreground mt-2 block">
                                    Esta ação registrará a data de hoje como data de pagamento.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBaixaPagamento(item.id)}>
                                  Confirmar Pagamento
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financial;