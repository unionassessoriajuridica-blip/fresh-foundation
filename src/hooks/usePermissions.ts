// usePermissions.ts - VERSÃO COMPLETAMENTE CORRIGIDA
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { useAuth } from '@/hooks/useAuth.ts';

export type UserPermission = 
  | 'READ'
  | 'WRITE'
  | 'ADMIN'
  | 'financeiro'
  | 'ia_facilita' 
  | 'facilisign'
  | 'novo_processo'
  | 'google_integration'
  | 'agenda'
  | 'modificar_clientes'
  | 'excluir_processo'
  | 'user_management';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadUserPermissions = async () => {
    try {
      console.log('Iniciando carregamento de permissões para user:', user?.id);
      
      if (!user?.id) {
        console.log('Nenhum usuário logado, retornando permissões vazias');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // DEBUG: Verificar se a tabela existe e tem dados
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_permissions')
        .select('count')
        .limit(1);

      console.log('Verificação da tabela:', tableCheck, tableError);

      // Buscar permissões do usuário
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      console.log('Resultado da query de permissões:', data, error);

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar permissões',
          variant: 'destructive',
        });
        setPermissions([]);
        return;
      }
      
      const perms = data?.map(item => item.permission as UserPermission) || [];
      console.log('Permissões mapeadas:', perms);
      setPermissions(perms);
    } catch (error) {
      console.error('Erro inesperado ao carregar permissões:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserPermissions();
    } else {
      setLoading(false);
      setPermissions([]);
    }
  }, [user]);

  const hasPermission = (permission: UserPermission): boolean => {
    const hasPerm = permissions.includes(permission);
    console.log(`Verificando permissão ${permission}:`, hasPerm);
    return hasPerm;
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
    requirePermission,
    refreshPermissions: loadUserPermissions
  };
};