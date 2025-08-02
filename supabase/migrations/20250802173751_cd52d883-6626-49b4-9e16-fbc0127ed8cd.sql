-- Remover política que depende da função
DROP POLICY IF EXISTS "Only masters can manage roles" ON public.user_roles;

-- Atualizar função para corrigir problema de security
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recriar política usando a função corrigida
CREATE POLICY "Only masters can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'master'));