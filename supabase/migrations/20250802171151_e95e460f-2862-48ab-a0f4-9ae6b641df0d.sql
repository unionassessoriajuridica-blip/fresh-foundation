-- Adicionar foreign key constraint entre processos e clientes
ALTER TABLE public.processos 
ADD CONSTRAINT fk_processos_clientes 
FOREIGN KEY (cliente_id) 
REFERENCES public.clientes(id) 
ON DELETE CASCADE;