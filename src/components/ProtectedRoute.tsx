import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiresPermissions?: string[];
  fallbackPath?: string;
}

// Enhanced loading component for protected routes
const ProtectedRouteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-sm text-muted-foreground">Verificando permissões...</p>
  </div>
);

// Access denied component
const AccessDenied = ({ userRole, requiredRoles }: { userRole?: string; requiredRoles?: string[] }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8">
    <Alert className="max-w-md">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p className="font-medium">Acesso negado</p>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          {userRole && requiredRoles && (
            <p className="text-xs text-muted-foreground">
              Seu perfil: {userRole} | Requerido: {requiredRoles.join(', ')}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  </div>
);

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiresPermissions,
  fallbackPath = "/auth" 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading state while authentication is being verified
  if (loading) {
    return <ProtectedRouteLoader />;
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && profile) {
    if (!allowedRoles.includes(profile.role)) {
      // For role-based access denial, show access denied instead of redirect
      return <AccessDenied userRole={profile.role} requiredRoles={allowedRoles} />;
    }
  }

  // Check permission-based access (future enhancement)
  if (requiresPermissions && profile) {
    // This could be enhanced to check specific permissions
    // For now, we'll just ensure the user has a valid profile
    // TODO: Implement permissions system in Profile model
    console.log('Permission check requested but not implemented:', requiresPermissions);
  }

  // Route-specific access control
  const routeAccess = getRouteAccess(location.pathname, profile?.role);
  if (!routeAccess.allowed) {
    if (routeAccess.redirectTo) {
      return <Navigate to={routeAccess.redirectTo} replace />;
    }
    return <AccessDenied userRole={profile?.role} requiredRoles={routeAccess.requiredRoles} />;
  }

  return <>{children}</>;
}

// Route access control logic
interface RouteAccess {
  allowed: boolean;
  redirectTo?: string;
  requiredRoles?: string[];
}

function getRouteAccess(pathname: string, userRole?: string): RouteAccess {
  // Define route access rules
  const routeRules: Record<string, { roles: string[]; redirectTo?: string }> = {
    '/dashboard': { roles: ['instrutor', 'admin'] },
    '/estudantes': { roles: ['instrutor', 'admin'] },
    '/programas': { roles: ['instrutor', 'admin'] },
    '/designacoes': { roles: ['instrutor', 'admin'] },
    '/relatorios': { roles: ['instrutor', 'admin'] },
    '/reunioes': { roles: ['instrutor', 'admin'] },
    '/assignments': { roles: ['instrutor', 'admin'] },
    '/treasures-designacoes': { roles: ['instrutor', 'admin'] },
  };

  // Student-specific routes
  if (pathname.startsWith('/estudante/')) {
    if (userRole === 'estudante') {
      // Students can only access their own profile
      return { allowed: true };
    } else if (userRole === 'instrutor' || userRole === 'admin') {
      // Instructors and admins can access any student profile
      return { allowed: true };
    }
    return { 
      allowed: false, 
      requiredRoles: ['estudante', 'instrutor', 'admin'] 
    };
  }

  // Check specific route rules
  const rule = routeRules[pathname];
  if (rule) {
    if (!userRole || !rule.roles.includes(userRole)) {
      return {
        allowed: false,
        redirectTo: rule.redirectTo,
        requiredRoles: rule.roles
      };
    }
  }

  // Default: allow access
  return { allowed: true };
}

// Export utility function for checking route access in components
export function useRouteAccess(pathname?: string) {
  const { profile } = useAuth();
  const location = useLocation();
  const currentPath = pathname || location.pathname;
  
  return getRouteAccess(currentPath, profile?.role);
}