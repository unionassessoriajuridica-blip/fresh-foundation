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
  User
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const stats = [
    {
      title: "Processos Ativos",
      value: "3",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Audiências Hoje", 
      value: "0",
      icon: Calendar,
      color: "text-success"
    },
    {
      title: "Clientes",
      value: "3", 
      icon: Users,
      color: "text-purple"
    },
    {
      title: "Receita Mensal",
      value: "R$ 0,00",
      icon: DollarSign,
      color: "text-warning"
    }
  ];

  const processos = [
    {
      id: "020201250525253352",
      cliente: "TESTE 1",
      tipo: "Cível",
      clientePreso: "SIM",
      prazo: ""
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
                3
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Rafael Anastácio</span>
                <span className="text-xs text-muted-foreground">RA</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
          <Button variant="success">
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            FaciliSign ID
          </Button>
          <Button variant="purple">
            IA-Facilita
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
              <span className="text-sm text-muted-foreground">3 processo(s) ativo(s)</span>
            </div>
          </CardHeader>
          <CardContent>
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
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 text-success" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4 text-warning" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{processo.id}</TableCell>
                    <TableCell>{processo.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {processo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        {processo.clientePreso}
                      </Badge>
                    </TableCell>
                    <TableCell>{processo.prazo}</TableCell>
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

export default Dashboard;