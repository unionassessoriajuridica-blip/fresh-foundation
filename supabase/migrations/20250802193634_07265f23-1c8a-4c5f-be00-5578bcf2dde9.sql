-- Create table for digital documents
CREATE TABLE public.documentos_digitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  status TEXT NOT NULL DEFAULT 'TEMPLATE_CRIADO',
  docuseal_template_id TEXT NOT NULL,
  docuseal_submission_id TEXT,
  signatarios JSONB,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documentos_digitais ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own digital documents" 
ON public.documentos_digitais 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital documents" 
ON public.documentos_digitais 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital documents" 
ON public.documentos_digitais 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digital documents" 
ON public.documentos_digitais 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documentos_digitais_updated_at
BEFORE UPDATE ON public.documentos_digitais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_documentos_digitais_user_id ON public.documentos_digitais(user_id);
CREATE INDEX idx_documentos_digitais_status ON public.documentos_digitais(status);
CREATE INDEX idx_documentos_digitais_docuseal_submission_id ON public.documentos_digitais(docuseal_submission_id);

-- Update config to make webhook function public