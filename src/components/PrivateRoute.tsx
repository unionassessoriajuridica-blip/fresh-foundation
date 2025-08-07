// src/components/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Supondo que você tenha um hook de autenticação

export function PrivateRoute() {
  const { isAuthenticated } = useAuth(); // Seu hook de autenticação

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}