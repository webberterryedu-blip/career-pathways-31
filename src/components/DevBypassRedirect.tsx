/**
 * Componente de redirecionamento para bypass de desenvolvimento
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const DevBypassRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Se o bypass está ativo e temos um usuário, redireciona para dashboard
  const shouldRedirect = import.meta.env.DEV && 
                        import.meta.env.VITE_AUTH_BYPASS === 'true' && 
                        user && 
                        !loading &&
                        location.pathname === '/auth';

  if (shouldRedirect) {
    console.log('🚀 BYPASS: Redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};