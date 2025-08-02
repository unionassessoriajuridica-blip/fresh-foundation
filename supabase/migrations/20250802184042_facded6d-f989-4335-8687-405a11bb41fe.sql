-- Criar bucket para arquivos do chat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', false);

-- Criar políticas para o bucket chat-files
CREATE POLICY "Users can upload their own chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own chat files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar tabela para histórico de conversas
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  mode TEXT NOT NULL DEFAULT 'chat', -- 'chat', 'agent', 'research'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Criar políticas para conversas
CREATE POLICY "Users can create their own conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.chat_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.chat_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();