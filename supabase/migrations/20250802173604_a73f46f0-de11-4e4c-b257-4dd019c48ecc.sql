-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'user');

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Criar política para users poderem ver suas próprias roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Criar política para apenas masters poderem inserir/atualizar roles
CREATE POLICY "Only masters can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'master'));

-- Inserir role master para o primeiro usuário (você pode ajustar o user_id depois)
-- Esta linha será comentada para ser executada manualmente depois
-- INSERT INTO public.user_roles (user_id, role) VALUES ('seu-user-id-aqui', 'master');