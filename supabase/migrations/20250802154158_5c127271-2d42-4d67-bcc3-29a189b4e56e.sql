-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de processos
CREATE TABLE public.processos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_processo TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  tipo_processo TEXT NOT NULL,
  cliente_preso BOOLEAN DEFAULT FALSE,
  descricao TEXT,
  prazo DATE,
  status TEXT DEFAULT 'ATIVO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de movimentações financeiras
CREATE TABLE public.financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL, -- 'Honorários', 'Custas', etc
  status TEXT DEFAULT 'PENDENTE', -- 'PAGO', 'PENDENTE', 'ATRASADO'
  vencimento DATE,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de documentos para assinatura
CREATE TABLE public.documentos_assinatura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE', -- 'ASSINADO', 'PENDENTE', 'EXPIRADO'
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_assinatura TIMESTAMP WITH TIME ZONE,
  signatarios TEXT[] DEFAULT '{}',
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_assinatura ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Users can view their own clients" 
ON public.clientes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
ON public.clientes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clientes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clientes FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para processos
CREATE POLICY "Users can view their own processes" 
ON public.processos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processes" 
ON public.processos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processes" 
ON public.processos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processes" 
ON public.processos FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para financeiro
CREATE POLICY "Users can view their own financial records" 
ON public.financeiro FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial records" 
ON public.financeiro FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial records" 
ON public.financeiro FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial records" 
ON public.financeiro FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para documentos de assinatura
CREATE POLICY "Users can view their own signature documents" 
ON public.documentos_assinatura FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signature documents" 
ON public.documentos_assinatura FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signature documents" 
ON public.documentos_assinatura FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signature documents" 
ON public.documentos_assinatura FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processos_updated_at
  BEFORE UPDATE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financeiro_updated_at
  BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_assinatura_updated_at
  BEFORE UPDATE ON public.documentos_assinatura
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();