import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NewProcess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [clienteData, setClienteData] = useState({
    nomeCompleto: "",
    rg: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: ""
  });

  const [processoData, setProcessoData] = useState({
    numeroProcesso: "",
    tipoProcesso: "",
    temPrazo: false,
    prazo: ""
  });

  const [financeiroData, setFinanceiroData] = useState({
    valorHonorarios: "",
    valorEntrada: "",
    dataEntrada: "",
    quantidadeParcelas: "",
    dataPrimeiroVencimento: "",
    incluirTMP: false
  });

  const tiposProcesso = [
    "Criminal",
    "Cível", 
    "Trabalhista",
    "Família",
    "Previdenciário",
    "Tributário",
    "Administrativo",
    "Consumidor"
  ];

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado.",
      });
      return;
    }

    setLoading(true);

    try {
      // Primeiro criar o cliente
      const { data: clienteCreated, error: clienteError } = await supabase
        .from('clientes')
        .insert([
          {
            user_id: user.id,
            nome: clienteData.nomeCompleto,
            email: clienteData.email,
            telefone: clienteData.telefone,
            cpf_cnpj: clienteData.cpf,
            endereco: `${clienteData.endereco}, ${clienteData.bairro}, ${clienteData.cidade} - ${clienteData.cep}`
          }
        ])
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Depois criar o processo
      const { error: processoError } = await supabase
        .from('processos')
        .insert([
          {
            user_id: user.id,
            numero_processo: processoData.numeroProcesso,
            cliente_id: clienteCreated.id,
            tipo_processo: processoData.tipoProcesso,
            prazo: processoData.temPrazo ? processoData.prazo : null,
            status: 'ATIVO'
          }
        ]);

      if (processoError) throw processoError;

      // Se tiver dados financeiros, criar registros financeiros
      if (financeiroData.valorHonorarios) {
        const valorHonorarios = parseFloat(financeiroData.valorHonorarios.replace('R$ ', '').replace(',', '.'));
        const valorEntrada = parseFloat(financeiroData.valorEntrada.replace('R$ ', '').replace(',', '.') || '0');
        const quantidadeParcelas = parseInt(financeiroData.quantidadeParcelas || '1');

        // Criar entrada se houver
        if (valorEntrada > 0) {
          await supabase
            .from('financeiro')
            .insert([
              {
                user_id: user.id,
                cliente_nome: clienteData.nomeCompleto,
                valor: valorEntrada,
                tipo: 'Entrada',
                status: 'PENDENTE',
                vencimento: financeiroData.dataEntrada
              }
            ]);
        }

        // Criar parcelas
        const valorParcela = (valorHonorarios - valorEntrada) / quantidadeParcelas;
        const dataBase = new Date(financeiroData.dataPrimeiroVencimento);

        for (let i = 0; i < quantidadeParcelas; i++) {
          const dataVencimento = new Date(dataBase);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);

          await supabase
            .from('financeiro')
            .insert([
              {
                user_id: user.id,
                cliente_nome: clienteData.nomeCompleto,
                valor: valorParcela,
                tipo: 'Honorários',
                status: 'PENDENTE',
                vencimento: dataVencimento.toISOString().split('T')[0]
              }
            ]);
        }

        // Criar TMP se marcado
        if (financeiroData.incluirTMP) {
          await supabase
            .from('financeiro')
            .insert([
              {
                user_id: user.id,
                cliente_nome: clienteData.nomeCompleto,
                valor: valorHonorarios * 0.02, // 2% do valor dos honorários
                tipo: 'TMP',
                status: 'PENDENTE',
                vencimento: financeiroData.dataPrimeiroVencimento
              }
            ]);
        }
      }

      toast({
        title: "Processo criado!",
        description: "O processo foi cadastrado com sucesso.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar processo",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <User className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Dados do Cliente</CardTitle>
        <p className="text-muted-foreground">Informações pessoais do cliente</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="nomeCompleto">Nome Completo *</Label>
          <Input
            id="nomeCompleto"
            value={clienteData.nomeCompleto}
            onChange={(e) => setClienteData({ ...clienteData, nomeCompleto: e.target.value })}
            placeholder="Nome completo do cliente"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              value={clienteData.rg}
              onChange={(e) => setClienteData({ ...clienteData, rg: e.target.value })}
              placeholder="Número do RG"
            />
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={clienteData.cpf}
              onChange={(e) => setClienteData({ ...clienteData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={clienteData.dataNascimento}
              onChange={(e) => setClienteData({ ...clienteData, dataNascimento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={clienteData.telefone}
              onChange={(e) => setClienteData({ ...clienteData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={clienteData.email}
            onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
            placeholder="email@cliente.com"
          />
        </div>

        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={clienteData.endereco}
            onChange={(e) => setClienteData({ ...clienteData, endereco: e.target.value })}
            placeholder="Rua, número, complemento"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={clienteData.bairro}
              onChange={(e) => setClienteData({ ...clienteData, bairro: e.target.value })}
              placeholder="Bairro"
            />
          </div>

          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={clienteData.cidade}
              onChange={(e) => setClienteData({ ...clienteData, cidade: e.target.value })}
              placeholder="Cidade"
            />
          </div>
        </div>

        <div className="w-1/2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={clienteData.cep}
            onChange={(e) => setClienteData({ ...clienteData, cep: e.target.value })}
            placeholder="00000-000"
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90">
            Próximo
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <FileText className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Dados do Processo</CardTitle>
        <p className="text-muted-foreground">Informações sobre o processo judicial</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="numeroProcesso">Número do Processo *</Label>
          <Input
            id="numeroProcesso"
            value={processoData.numeroProcesso}
            onChange={(e) => setProcessoData({ ...processoData, numeroProcesso: e.target.value })}
            placeholder="0000000-00.0000.0.00.0000"
            required
          />
        </div>

        <div>
          <Label htmlFor="tipoProcesso">Tipo do Processo *</Label>
          <Select value={processoData.tipoProcesso} onValueChange={(value) => setProcessoData({ ...processoData, tipoProcesso: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposProcesso.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="temPrazo"
            checked={processoData.temPrazo}
            onCheckedChange={(checked) => setProcessoData({ ...processoData, temPrazo: checked as boolean })}
          />
          <Label htmlFor="temPrazo">Este processo tem prazo</Label>
        </div>

        {processoData.temPrazo && (
          <div>
            <Label htmlFor="prazo">Data do Prazo</Label>
            <Input
              id="prazo"
              type="date"
              value={processoData.prazo}
              onChange={(e) => setProcessoData({ ...processoData, prazo: e.target.value })}
            />
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90">
            Próximo
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <DollarSign className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Configuração Financeira</CardTitle>
        <p className="text-muted-foreground">Configure os valores e formas de pagamento</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="valorHonorarios">Valor dos Honorários *</Label>
          <Input
            id="valorHonorarios"
            value={financeiroData.valorHonorarios}
            onChange={(e) => setFinanceiroData({ ...financeiroData, valorHonorarios: e.target.value })}
            placeholder="R$ 0,00"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="valorEntrada">Valor da Entrada</Label>
            <Input
              id="valorEntrada"
              value={financeiroData.valorEntrada}
              onChange={(e) => setFinanceiroData({ ...financeiroData, valorEntrada: e.target.value })}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="dataEntrada">Data da Entrada</Label>
            <Input
              id="dataEntrada"
              type="date"
              value={financeiroData.dataEntrada}
              onChange={(e) => setFinanceiroData({ ...financeiroData, dataEntrada: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="quantidadeParcelas">Quantidade de Parcelas</Label>
            <Input
              id="quantidadeParcelas"
              value={financeiroData.quantidadeParcelas}
              onChange={(e) => setFinanceiroData({ ...financeiroData, quantidadeParcelas: e.target.value })}
              placeholder="Ex: 12"
            />
          </div>

          <div>
            <Label htmlFor="dataPrimeiroVencimento">Data do Primeiro Vencimento</Label>
            <Input
              id="dataPrimeiroVencimento"
              type="date"
              value={financeiroData.dataPrimeiroVencimento}
              onChange={(e) => setFinanceiroData({ ...financeiroData, dataPrimeiroVencimento: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="incluirTMP"
            checked={financeiroData.incluirTMP}
            onCheckedChange={(checked) => setFinanceiroData({ ...financeiroData, incluirTMP: checked as boolean })}
          />
          <Label htmlFor="incluirTMP">Incluir TMP (Taxa de Manutenção Processual)</Label>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Salvando..." : "Finalizar Cadastro"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Processo</h1>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
          </div>
        </div>

        {/* Render current step */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default NewProcess;