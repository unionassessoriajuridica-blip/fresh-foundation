import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Signatario {
  nome: string;
  email: string;
  role?: string;
}

export interface DocumentoDigital {
  id: string;
  nome: string;
  tipo: string;
  status: 'TEMPLATE_CRIADO' | 'ENVIADO_PARA_ASSINATURA' | 'ASSINADO' | 'EXPIRADO' | 'RECUSADO';
  docuseal_template_id: string;
  docuseal_submission_id?: string;
  signatarios?: Signatario[];
  created_at: string;
  updated_at: string;
}

export const useDocuSeal = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadDocument = async (file: File, title?: string): Promise<DocumentoDigital | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);

      const { data, error } = await supabase.functions.invoke('docuseal-upload', {
        body: formData,
      });

      if (error) {
        toast({
          title: 'Erro no upload',
          description: 'Falha ao fazer upload do documento',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Upload realizado',
        description: 'Documento enviado com sucesso',
      });

      return data.document;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Falha ao fazer upload do documento',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendForSignature = async (templateId: string, signatarios: Signatario[]): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('docuseal-send-signature', {
        body: { templateId, signatarios },
      });

      if (error) {
        toast({
          title: 'Erro ao enviar',
          description: 'Falha ao enviar documento para assinatura',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Documento enviado',
        description: 'Documento enviado para assinatura com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Send signature error:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Falha ao enviar documento para assinatura',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDocuments = async (): Promise<DocumentoDigital[]> => {
    try {
      const { data, error } = await supabase
        .from('documentos_digitais' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return (data || []) as unknown as DocumentoDigital[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ASSINADO':
        return 'bg-green-100 text-green-800';
      case 'ENVIADO_PARA_ASSINATURA':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRADO':
        return 'bg-red-100 text-red-800';
      case 'RECUSADO':
        return 'bg-red-100 text-red-800';
      case 'TEMPLATE_CRIADO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    loading,
    uploading,
    uploadDocument,
    sendForSignature,
    getDocuments,
    getStatusBadgeColor,
  };
};