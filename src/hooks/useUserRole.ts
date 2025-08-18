import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserRoles = useCallback(async () => {
    try {
      if (!user?.id) {
        setRoles([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      setRoles(error ? [] : data?.map(r => r.role) || []);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  const hasRole = (role: string) => roles.includes(role);

  return {
    roles,
    loading,
    hasRole,
    isMaster: hasRole('master'),
    isAdmin: hasRole('admin'),
    canDelete: hasRole('master')
  };
};