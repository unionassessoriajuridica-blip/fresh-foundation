import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Financial = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = [
    {
      title: "Receita Total",
      value: "R$ 45.250,00",
      icon: DollarSign,
      color: "text-success",
      trend: "+12.5%"
    },
    {
      title: "Pendentes",
      value: "R$ 8.750,00",
      icon: TrendingDown,
      color: "text-warning",
      trend: "-2.1%"
    },
    {
      title: "Recebidos",
      value: "R$ 36.500,00",
      icon: TrendingUp,
      color: "text-primary",
      trend: "+18.2%"
    },
    {
      title: "Taxa Média",
      value: "15%",
      icon: Calculator,
      color: "text-purple",
      trend: "+0.5%"
    }
  ];

  const transactions = [
    {
      id: 1,
      cliente: "Maria Silva",
      processo: "0001234-56.2024.1.23.4567",
      valor: "R$ 2.500,00",
      status: "Pago",
      vencimento: "2024-01-15",
      tipo: "Honorários"
    },
    {
      id: 2,
      cliente: "João Santos",
      processo: "0007890-12.2024.1.23.4567",
      valor: "R$ 1.800,00",
      status: "Pendente",
      vencimento: "2024-02-10",
      tipo: "Custas"
    },
    {
      id: 3,
      cliente: "Ana Costa",
      processo: "0005432-98.2024.1.23.4567",
      valor: "R$ 3.200,00",
      status: "Atrasado",
      vencimento: "2024-01-05",
      tipo: "Honorários"
    }
  ];

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        // Aqui você carregaria os dados reais do banco
        setFinancialData(transactions);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago':
        return <Badge className="bg-success/10 text-success border-success/20">Pago</Badge>;
      case 'Pendente':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      case 'Atrasado':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Financeiro</h1>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Movimentações Financeiras
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Buscar transações..."
                  className="w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.cliente}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.processo}</TableCell>
                    <TableCell>{transaction.tipo}</TableCell>
                    <TableCell className="font-semibold">{transaction.valor}</TableCell>
                    <TableCell>{new Date(transaction.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          Recibo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financial;