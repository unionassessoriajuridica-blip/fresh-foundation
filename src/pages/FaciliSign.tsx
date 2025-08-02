import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Shield, Clock, Download, Eye, Users, CheckCircle, AlertCircle, XCircle, Plus, Trash2, ArrowLeft, FileSignature } from 'lucide-react';
import { useDocuSeal, type DocumentoDigital, type Signatario } from '@/hooks/useDocuSeal';
import { useToast } from '@/hooks/use-toast';

const FaciliSign = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentoDigital[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [signatarios, setSignatarios] = useState<Signatario[]>([{ nome: '', email: '' }]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentoDigital | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const { uploadDocument, sendForSignature, getDocuments, getStatusBadgeColor, loading, uploading } = useDocuSeal();
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const docs = await getDocuments();
    setDocuments(docs);
  };

  const getStats = () => {
    const assinados = documents.filter(doc => doc.status === 'ASSINADO').length;
    const pendentes = documents.filter(doc => doc.status === 'ENVIADO_PARA_ASSINATURA').length;
    const templates = documents.filter(doc => doc.status === 'TEMPLATE_CRIADO').length;

    return [
      {
        title: "Documentos Assinados",
        value: assinados.toString(),
        icon: FileSignature,
        color: "text-success"
      },
      {
        title: "Pendentes",
        value: pendentes.toString(),
        icon: Clock,
        color: "text-warning"
      },
      {
        title: "Templates",
        value: templates.toString(),
        icon: Shield,
        color: "text-primary"
      }
    ];
  };

  const stats = getStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ASSINADO': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Assinado' },
      'ENVIADO_PARA_ASSINATURA': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Pendente' },
      'TEMPLATE_CRIADO': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Template' },
      'EXPIRADO': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expirado' },
      'RECUSADO': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Recusado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['TEMPLATE_CRIADO'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const document = await uploadDocument(selectedFile, documentTitle);
    if (document) {
      await loadDocuments();
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentTitle('');
    }
  };

  const addSignatario = () => {
    setSignatarios([...signatarios, { nome: '', email: '' }]);
  };

  const removeSignatario = (index: number) => {
    setSignatarios(signatarios.filter((_, i) => i !== index));
  };

  const updateSignatario = (index: number, field: keyof Signatario, value: string) => {
    const updated = [...signatarios];
    updated[index][field] = value;
    setSignatarios(updated);
  };

  const handleSendForSignature = async () => {
    if (!selectedDocument) return;

    const validSignatarios = signatarios.filter(sig => sig.nome && sig.email);
    if (validSignatarios.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um signatário válido',
        variant: 'destructive',
      });
      return;
    }

    const success = await sendForSignature(selectedDocument.docuseal_template_id, validSignatarios);
    if (success) {
      await loadDocuments();
      setShowSignatureDialog(false);
      setSelectedDocument(null);
      setSignatarios([{ nome: '', email: '' }]);
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
            <div className="flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold">FaciliSign ID</h1>
              <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">DIGITAL</span>
            </div>
          </div>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um documento para criar um template de assinatura.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Arquivo PDF</Label>
                  <Input 
                    id="file" 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Título do Documento</Label>
                  <Input 
                    id="title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Digite o título do documento"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowUploadDialog(true)}>
            <CardContent className="p-6 text-center">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Enviar Documento</h3>
              <p className="text-sm text-muted-foreground">Faça upload de documentos para assinatura digital</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Assinatura Segura</h3>
              <p className="text-sm text-muted-foreground">Assinaturas digitais com validade jurídica</p>
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
                  <TableHead>Datas</TableHead>
                  <TableHead>Signatários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nome}</TableCell>
                    <TableCell>{doc.tipo || 'PDF'}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Criado: {new Date(doc.created_at).toLocaleDateString('pt-BR')}<br />
                      {doc.updated_at !== doc.created_at && `Atualizado: ${new Date(doc.updated_at).toLocaleDateString('pt-BR')}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{doc.signatarios?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {doc.status === 'TEMPLATE_CRIADO' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowSignatureDialog(true);
                            }}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {doc.status === 'ASSINADO' && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum documento encontrado. Clique em "Novo Documento" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para envio de assinatura */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar para Assinatura</DialogTitle>
            <DialogDescription>
              Configure os signatários para o documento: {selectedDocument?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Signatários</Label>
              {signatarios.map((signatario, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome completo"
                    value={signatario.nome}
                    onChange={(e) => updateSignatario(index, 'nome', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="email@exemplo.com"
                    type="email"
                    value={signatario.email}
                    onChange={(e) => updateSignatario(index, 'email', e.target.value)}
                    className="flex-1"
                  />
                  {signatarios.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSignatario(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addSignatario}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Signatário
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSendForSignature}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar para Assinatura'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSignatureDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaciliSign;