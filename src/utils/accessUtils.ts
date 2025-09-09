// accessUtils.ts - VERSÃO CORRIGIDA E MELHORADA
import { usePermissions } from "@/hooks/usePermissions.ts";

export const canViewAllProcesses = (permissions: string[]): boolean => {
  const hasAccess = permissions.includes("ver_todos_processos") || 
                   permissions.includes("ADMIN") || 
                   permissions.includes("master");
  console.log("Resultado canViewAllProcesses:", hasAccess, "Permissões:", permissions);
  return hasAccess;
};

export const canViewAllFinancial = (permissions: string[]): boolean => {
  const hasAccess = permissions.includes("financeiro") && 
                   (permissions.includes("ver_todos_processos") || 
                    permissions.includes("ADMIN") || 
                    permissions.includes("master"));
  console.log("Resultado canViewAllFinancial:", hasAccess, "Permissões:", permissions);
  return hasAccess;
};

export const canViewAllClients = (permissions: string[]): boolean => {
  const hasAccess = permissions.includes("ver_todos_processos") || 
                   permissions.includes("ADMIN") || 
                   permissions.includes("master");
  console.log("Resultado canViewAllClients:", hasAccess, "Permissões:", permissions);
  return hasAccess;
};

export const useGlobalAccess = () => {
  const { permissions, loading } = usePermissions();

  const canViewAllProcessesValue = canViewAllProcesses(permissions);
  const canViewAllFinancialValue = canViewAllFinancial(permissions);
  const canViewAllClientsValue = canViewAllClients(permissions);

  console.log("useGlobalAccess - Resultados:", {
    canViewAllProcesses: canViewAllProcessesValue,
    canViewAllFinancial: canViewAllFinancialValue,
    canViewAllClients: canViewAllClientsValue,
    permissions: permissions
  });

  return {
    canViewAllProcesses: canViewAllProcessesValue,
    canViewAllFinancial: canViewAllFinancialValue,
    canViewAllClients: canViewAllClientsValue,
    permissionsLoading: loading,
  };
};