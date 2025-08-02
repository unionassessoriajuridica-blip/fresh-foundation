import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, FileSignature, Upload, Download, Eye, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FaciliSign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const stats = [
    {
      title: "Documentos Assinados",
      value: "24",
      icon: FileSignature,
      color: "text-success"
    },
    {
      title: "Pendentes",
      value: "3",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Certificados Válidos",
      value: "5",
      icon: Shield,
      color: "text-primary"
    }
  ];

  const documents = [
    {
      id: 1,
      nome: "Contrato de Prestação de Serviços - Cliente A",
      tipo: "Contrato",
      status: "Assinado",
      dataEnvio: "2024-01-15",
      dataAssinatura: "2024-01-16",
      signatarios: ["cliente@email.com", "advogado@facilitaadv.com"]
    },
    {
      id: 2,
      nome: "Procuração - Processo 123456",
      tipo: "Procuração",
      status: "Pendente",
      dataEnvio: "2024-01-20",
      dataAssinatura: null,
      signatarios: ["maria@email.com"]
    },
    {
      id: 3,
      nome: "Acordo Extrajudicial - Silva vs Santos",
      tipo: "Acordo",
      status: "Expirado",
      dataEnvio: "2024-01-10",
      dataAssinatura: null,
      signatarios: ["silva@email.com", "santos@email.com"]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assinado':
        return <Badge className="bg-success/10 text-success border-success/20">Assinado</Badge>;
      case 'Pendente':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      case 'Expirado':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleNewDocument = () => {
    toast({
      title: "Novo Documento",
      description: "Funcionalidade de assinatura digital em desenvolvimento.",
    });
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
            <div className="flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold">FaciliSign ID</h1>
              <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">DIGITAL</span>
            </div>
          </div>
          <Button onClick={handleNewDocument} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleNewDocument}>
            <CardContent className="p-6 text-center">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Enviar Documento</h3>
              <p className="text-sm text-muted-foreground">Faça upload de documentos para assinatura digital</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Certificado ICP-Brasil</h3>
              <p className="text-sm text-muted-foreground">Assinaturas com validade jurídica garantida</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Acompanhamento</h3>
              <p className="text-sm text-muted-foreground">Monitore o status das assinaturas em tempo real</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Documentos para Assinatura
              </CardTitle>
              <Input 
                placeholder="Buscar documentos..."
                className="w-80"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead>Data Assinatura</TableHead>
                  <TableHead>Signatários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nome}</TableCell>
                    <TableCell>{doc.tipo}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{new Date(doc.dataEnvio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      {doc.dataAssinatura ? new Date(doc.dataAssinatura).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        {doc.signatarios.map((email, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground truncate">
                            {email}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" title="Visualizar">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" title="Download">
                          <Download className="w-3 h-3" />
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

export default FaciliSign;