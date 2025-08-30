// accessUtils.ts - VERSÃO CORRIGIDA
import { usePermissions } from "@/hooks/usePermissions.ts";

// Função para verificar se usuário tem acesso a todos os processos
export const canViewAllProcesses = (permissions: string[]): boolean => {
  console.log("Permissões recebidas em canViewAllProcesses:", permissions);
  const hasAccess = (
    permissions.includes("ver_todos_processos") ||
    permissions.includes("ADMIN") ||
    permissions.includes("excluir_processo") || 
    permissions.includes("modificar_clientes")
  );
  console.log("Resultado canViewAllProcesses:", hasAccess);
  return hasAccess;
};

// Função para verificar se usuário tem acesso a todos os dados financeiros
export const canViewAllFinancial = (permissions: string[]): boolean => {
  console.log("Permissões recebidas em canViewAllFinancial:", permissions);
  const hasAccess = (
    permissions.includes("financeiro") ||
    permissions.includes("ADMIN") ||
    permissions.includes("ver_todos_processos")
  );
  console.log("Resultado canViewAllFinancial:", hasAccess);
  return hasAccess;
};

// Função para verificar se usuário tem acesso a todos os clientes
export const canViewAllClients = (permissions: string[]): boolean => {
  console.log("Permissões recebidas em canViewAllClients:", permissions);
  const hasAccess = (
    permissions.includes("ver_todos_processos") ||
    permissions.includes("ADMIN") ||
    permissions.includes("modificar_clientes")
  );
  console.log("Resultado canViewAllClients:", hasAccess);
  return hasAccess;
};

export const useGlobalAccess = () => {
  const { permissions, loading } = usePermissions();

  const canViewAllProcessesValue = canViewAllProcesses(permissions);
  const canViewAllFinancialValue = canViewAllFinancial(permissions);
  const canViewAllClientsValue = canViewAllClients(permissions);

  console.log("useGlobalAccess - Permissões:", permissions);
  console.log("useGlobalAccess - Resultados:", {
    canViewAllProcesses: canViewAllProcessesValue,
    canViewAllFinancial: canViewAllFinancialValue,
    canViewAllClients: canViewAllClientsValue
  });

  return {
    canViewAllProcesses: canViewAllProcessesValue,
    canViewAllFinancial: canViewAllFinancialValue,
    canViewAllClients: canViewAllClientsValue,
    permissionsLoading: loading,
  };
};