-- Corrigir função com search_path adequado
DROP FUNCTION IF EXISTS public.check_parcelas_em_aberto();

CREATE OR REPLACE FUNCTION public.check_parcelas_em_aberto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    FROM public.financeiro 
    WHERE status = 'PENDENTE'
    GROUP BY user_id, cliente_nome
    HAVING COUNT(*) >= 3
  LOOP
    -- Verificar se já existe uma notificação não lida para este cliente
    SELECT EXISTS(
      SELECT 1 FROM public.notificacoes 
      WHERE user_id = cliente_record.user_id 
        AND cliente_nome = cliente_record.cliente_nome 
        AND tipo = 'PARCELAS_EM_ABERTO'
        AND lida = false
    ) INTO notification_exists;
    
    -- Se não existir notificação, criar uma nova
    IF NOT notification_exists THEN
      INSERT INTO public.notificacoes (
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