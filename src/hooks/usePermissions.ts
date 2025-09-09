// usePermissions.ts - VERSÃO CORRIGIDA
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
  | 'user_management'
  | 'ver_todos_processos'
  | 'master';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const loadUserPermissions = async () => {
    try {
      console.log('🔄 Carregando permissões para user:', user?.id);
      
      if (!user?.id) {
        console.log('⚠️ Nenhum usuário logado');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // DEBUG: Verificar se o usuário existe na tabela de permissões
      console.log('🔍 Verificando existência do usuário na tabela user_permissions...');
      
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permission, granted_by, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (permissionsError) {
        console.error('❌ Erro ao carregar permissões:', permissionsError);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar permissões do banco de dados',
          variant: 'destructive',
        });
      } else {
        console.log('✅ Permissões encontradas:', permissionsData);
      }

      const explicitPermissions = permissionsData?.map(item => 
        item.permission as UserPermission
      ) || [];

      console.log('📋 Permissões explícitas:', explicitPermissions);

      // Verificar roles também
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('❌ Erro ao carregar roles:', rolesError);
      } else {
        console.log('👑 Roles encontradas:', rolesData);
      }

      const roles = rolesData?.map(item => item.role) || [];
      
      // Se for master ou admin, adicionar permissões automáticas
      const automaticPermissions: UserPermission[] = [];
      if (roles.includes('master') || roles.includes('admin')) {
        console.log('🎯 Usuário é master/admin, concedendo permissões automáticas');
        automaticPermissions.push('ver_todos_processos');
        automaticPermissions.push('financeiro');
        automaticPermissions.push('modificar_clientes');
        automaticPermissions.push('excluir_processo');
      }

      // Combinar permissões
      const allPermissions = [...automaticPermissions, ...explicitPermissions];
      const uniquePermissions = Array.from(new Set(allPermissions));
      
      console.log('🎉 Permissões finais:', uniquePermissions);
      setPermissions(uniquePermissions);

    } catch (error) {
      console.error('💥 Erro inesperado ao carregar permissões:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só carregar permissões quando a autenticação não estiver loading E usuário existir
    if (!authLoading && user) {
      loadUserPermissions();
    } else if (!authLoading && !user) {
      // Usuário não autenticado
      setLoading(false);
      setPermissions([]);
    }
  }, [authLoading, user]);

  const hasPermission = (permission: UserPermission): boolean => {
    const hasPerm = permissions.includes(permission);
    console.log(`🔐 Verificando permissão ${permission}:`, hasPerm);
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