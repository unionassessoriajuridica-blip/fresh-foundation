import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Erro ao carregar roles:', error);
        setRoles([]);
      } else {
        setRoles(data.map(r => r.role));
      }
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return roles.includes(role);
  };

  const isMaster = () => hasRole('master');
  const isAdmin = () => hasRole('admin');
  const canDelete = () => isMaster(); // Apenas master pode excluir

  return {
    roles,
    loading,
    hasRole,
    isMaster,
    isAdmin,
    canDelete
  };
};