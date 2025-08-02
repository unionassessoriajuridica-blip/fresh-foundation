-- Criar tabela para notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  cliente_nome TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notificacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for timestamps
CREATE TRIGGER update_notificacoes_updated_at
BEFORE UPDATE ON public.notificacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar parcelas em aberto e criar notificações
CREATE OR REPLACE FUNCTION public.check_parcelas_em_aberto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_record RECORD;
  parcelas_count INTEGER;
  notification_exists BOOLEAN;
BEGIN
  -- Para cada combinação de user_id e cliente_nome, verificar parcelas em aberto
  FOR cliente_record IN 
    SELECT 
      user_id, 
      cliente_nome, 
      COUNT(*) as parcelas_pendentes
    FROM financeiro 
    WHERE status = 'PENDENTE'
    GROUP BY user_id, cliente_nome
    HAVING COUNT(*) >= 3
  LOOP
    -- Verificar se já existe uma notificação não lida para este cliente
    SELECT EXISTS(
      SELECT 1 FROM notificacoes 
      WHERE user_id = cliente_record.user_id 
        AND cliente_nome = cliente_record.cliente_nome 
        AND tipo = 'PARCELAS_EM_ABERTO'
        AND lida = false
    ) INTO notification_exists;
    
    -- Se não existir notificação, criar uma nova
    IF NOT notification_exists THEN
      INSERT INTO notificacoes (
        user_id, 
        tipo, 
        titulo, 
        mensagem, 
        cliente_nome
      ) VALUES (
        cliente_record.user_id,
        'PARCELAS_EM_ABERTO',
        'Atenção: Parcelas em Aberto',
        format('O cliente %s possui %s parcelas pendentes. Considere entrar em contato.', 
               cliente_record.cliente_nome, 
               cliente_record.parcelas_pendentes),
        cliente_record.cliente_nome
      );
    END IF;
  END LOOP;
END;
$$;