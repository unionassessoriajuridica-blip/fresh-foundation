import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/hooks/use-toast.ts';

export type UserPermission = 
  | 'financeiro'
  | 'ia_facilita' 
  | 'facilisign'
  | 'novo_processo'
  | 'google_integration'
  | 'agenda'
  | 'modificar_clientes'
  | 'excluir_processo';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_permissions', {
        _user_id: user.id
      });

      if (error) throw error;
      
      setPermissions(data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: UserPermission): boolean => {
    return permissions.includes(permission);
  };

  const checkPermission = async (permission: UserPermission): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_permission', {
        _user_id: user.id,
        _permission: permission
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const requirePermission = (permission: UserPermission, action: string = 'realizar esta ação') => {
    if (!hasPermission(permission)) {
      toast({
        title: 'Acesso negado',
        description: `Você não tem permissão para ${action}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  return {
    permissions,
    loading,
    hasPermission,
    checkPermission,
    requirePermission,
    refreshPermissions: loadUserPermissions
  };
};