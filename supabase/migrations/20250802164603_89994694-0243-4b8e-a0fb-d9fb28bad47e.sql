-- Create table for financial responsible person
CREATE TABLE public.responsavel_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  rg TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco_completo TEXT NOT NULL,
  cep TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.responsavel_financeiro ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own financial responsible" 
ON public.responsavel_financeiro 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial responsible" 
ON public.responsavel_financeiro 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial responsible" 
ON public.responsavel_financeiro 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial responsible" 
ON public.responsavel_financeiro 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_responsavel_financeiro_updated_at
BEFORE UPDATE ON public.responsavel_financeiro
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();