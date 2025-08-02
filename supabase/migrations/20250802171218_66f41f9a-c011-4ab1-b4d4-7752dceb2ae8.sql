-- Primeiro, vamos alterar o tipo do campo cliente_id para uuid
ALTER TABLE public.processos 
ALTER COLUMN cliente_id TYPE uuid USING cliente_id::uuid;

-- Agora adicionar a foreign key constraint
ALTER TABLE public.processos 
ADD CONSTRAINT fk_processos_clientes 
FOREIGN KEY (cliente_id) 
REFERENCES public.clientes(id) 
ON DELETE CASCADE;