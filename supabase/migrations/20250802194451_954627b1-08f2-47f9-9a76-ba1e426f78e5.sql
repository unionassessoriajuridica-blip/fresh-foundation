-- Create enum for specific permissions
CREATE TYPE public.user_permission AS ENUM (
  'financeiro',
  'ia_facilita', 
  'facilisign',
  'novo_processo',
  'google_integration',
  'agenda',
  'modificar_clientes',
  'excluir_processo'
);

-- Create table for user permissions
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission user_permission NOT NULL,
  granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable Row Level Security
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create table for user invitations
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  permissions user_permission[] NOT NULL DEFAULT '{}',
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for user_permissions
CREATE POLICY "Masters can view all permissions" 
ON public.user_permissions 
FOR SELECT 
USING (is_master_user());

CREATE POLICY "Masters can create permissions" 
ON public.user_permissions 
FOR INSERT 
WITH CHECK (is_master_user());

CREATE POLICY "Masters can update permissions" 
ON public.user_permissions 
FOR UPDATE 
USING (is_master_user());

CREATE POLICY "Masters can delete permissions" 
ON public.user_permissions 
FOR DELETE 
USING (is_master_user());

-- Policies for user_invitations
CREATE POLICY "Masters can view all invitations" 
ON public.user_invitations 
FOR SELECT 
USING (is_master_user());

CREATE POLICY "Masters can create invitations" 
ON public.user_invitations 
FOR INSERT 
WITH CHECK (is_master_user());

CREATE POLICY "Masters can update invitations" 
ON public.user_invitations 
FOR UPDATE 
USING (is_master_user());

CREATE POLICY "Masters can delete invitations" 
ON public.user_invitations 
FOR DELETE 
USING (is_master_user());

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission user_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR is_master_user()
$function$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS user_permission[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(permission), '{}')
  FROM public.user_permissions
  WHERE user_id = _user_id
$function$;

-- Create trigger for timestamp updates
CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();