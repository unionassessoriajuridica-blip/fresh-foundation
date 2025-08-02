-- Criar bucket para documentos de processos
INSERT INTO storage.buckets (id, name, public) VALUES ('processo-documentos', 'processo-documentos', false);

-- Criar tabela para observações dos processos
CREATE TABLE public.observacoes_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  processo_id UUID,
  cliente_nome TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.observacoes_processo ENABLE ROW LEVEL SECURITY;

-- Criar políticas para observações
CREATE POLICY "Users can view their own observacoes" 
ON public.observacoes_processo 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own observacoes" 
ON public.observacoes_processo 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own observacoes" 
ON public.observacoes_processo 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own observacoes" 
ON public.observacoes_processo 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para observações
CREATE TRIGGER update_observacoes_processo_updated_at
BEFORE UPDATE ON public.observacoes_processo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para documentos do processo
CREATE TABLE public.documentos_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  processo_id UUID,
  cliente_nome TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT NOT NULL,
  url_arquivo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS para documentos
ALTER TABLE public.documentos_processo ENABLE ROW LEVEL SECURITY;

-- Criar políticas para documentos
CREATE POLICY "Users can view their own documentos" 
ON public.documentos_processo 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documentos" 
ON public.documentos_processo 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documentos" 
ON public.documentos_processo 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documentos" 
ON public.documentos_processo 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para documentos
CREATE TRIGGER update_documentos_processo_updated_at
BEFORE UPDATE ON public.documentos_processo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar políticas para storage de documentos
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'processo-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'processo-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'processo-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'processo-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);