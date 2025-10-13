import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute, { useRouteAccess } from '@/components/ProtectedRoute';

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
  refreshProfile: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('ProtectedRoute Component', () => {
  const TestWrapper: React.FC<{ 
    children: React.ReactNode; 
    initialEntries?: string[];
  }> = ({ children, initialEntries = ['/'] }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.profile = null;
    mockAuthContext.loading = false;
  });

  describe('Authentication States', () => {
    it('should show loading state when authentication is loading', () => {
      mockAuthContext.loading = true;

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to auth when user is not authenticated', () => {
      mockAuthContext.user = null;
      mockAuthContext.loading = false;

      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Should redirect to /auth (this would be tested with router navigation)
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when user is authenticated and no role restrictions', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };
      mockAuthContext.loading = false;

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow access when user role matches allowed roles', () => {
      mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['instrutor', 'admin']}>
            <div>Instructor Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Instructor Content')).toBeInTheDocument();
    });

    it('should deny access when user role does not match allowed roles', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['instrutor', 'admin']}>
            <div>Instructor Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Acesso negado')).toBeInTheDocument();
      expect(screen.getByText('Você não tem permissão para acessar esta página.')).toBeInTheDocument();
      expect(screen.getByText('Seu perfil: estudante | Requerido: instrutor, admin')).toBeInTheDocument();
      expect(screen.queryByText('Instructor Content')).not.toBeInTheDocument();
    });

    it('should allow admin access to all routes', () => {
      mockAuthContext.user = { id: '3', email: 'admin@test.com' };
      mockAuthContext.profile = { id: '3', role: 'admin', user_id: '3' };

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['instrutor']}>
            <div>Instructor Only Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Instructor Only Content')).toBeInTheDocument();
    });

    it('should handle missing profile gracefully', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = null;

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['instrutor']}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Should show access denied when profile is missing
      expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    });
  });

  describe('Route-specific Access Control', () => {
    it('should allow instructor access to dashboard route', () => {
      mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Dashboard Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should deny student access to instructor routes', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Dashboard Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    });

    it('should allow student access to their own profile route', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      render(
        <TestWrapper initialEntries={['/estudante/2']}>
          <ProtectedRoute>
            <div>Student Profile</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Student Profile')).toBeInTheDocument();
    });

    it('should allow instructor access to any student profile route', () => {
      mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      render(
        <TestWrapper initialEntries={['/estudante/123']}>
          <ProtectedRoute>
            <div>Student Profile</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Student Profile')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Path', () => {
    it('should use custom fallback path when provided', () => {
      mockAuthContext.user = null;

      render(
        <TestWrapper initialEntries={['/protected']}>
          <ProtectedRoute fallbackPath="/custom-login">
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Would redirect to /custom-login instead of /auth
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Permission-based Access (Future Enhancement)', () => {
    it('should handle requiresPermissions parameter', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      // Mock console.log to verify the permission check message
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TestWrapper>
          <ProtectedRoute requiresPermissions={['manage_students']}>
            <div>Permission Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Permission check requested but not implemented:',
        ['manage_students']
      );
      expect(screen.getByText('Permission Protected Content')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});

describe('useRouteAccess Hook', () => {
  const RouteAccessTestComponent = ({ 
    pathname, 
    userRole 
  }: { 
    pathname: string; 
    userRole?: string;
  }) => {
    // Mock the auth context for this specific test
    mockAuthContext.profile = userRole ? { role: userRole } : null;
    
    const routeAccess = useRouteAccess(pathname);
    
    return (
      <div>
        <div data-testid="access-allowed">{routeAccess.allowed.toString()}</div>
        <div data-testid="redirect-to">{routeAccess.redirectTo || 'none'}</div>
        <div data-testid="required-roles">
          {routeAccess.requiredRoles?.join(', ') || 'none'}
        </div>
      </div>
    );
  };

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );

  beforeEach(() => {
    mockAuthContext.profile = null;
  });

  describe('Instructor Route Access', () => {
    const instructorRoutes = [
      '/dashboard',
      '/estudantes', 
      '/programas',
      '/designacoes',
      '/relatorios',
      '/reunioes',
      '/assignments',
      '/treasures-designacoes'
    ];

    instructorRoutes.forEach(route => {
      it(`should allow instructor access to ${route}`, () => {
        render(
          <TestWrapper>
            <RouteAccessTestComponent pathname={route} userRole="instrutor" />
          </TestWrapper>
        );

        expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
      });

      it(`should deny student access to ${route}`, () => {
        render(
          <TestWrapper>
            <RouteAccessTestComponent pathname={route} userRole="estudante" />
          </TestWrapper>
        );

        expect(screen.getByTestId('access-allowed')).toHaveTextContent('false');
        expect(screen.getByTestId('required-roles')).toHaveTextContent('instrutor, admin');
      });

      it(`should allow admin access to ${route}`, () => {
        render(
          <TestWrapper>
            <RouteAccessTestComponent pathname={route} userRole="admin" />
          </TestWrapper>
        );

        expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
      });
    });
  });

  describe('Student Route Access', () => {
    it('should allow student access to their own profile routes', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/123" userRole="estudante" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should allow instructor access to any student profile route', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/456" userRole="instrutor" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should allow admin access to any student profile route', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/789" userRole="admin" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should deny access to student routes for users without role', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/123" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('false');
      expect(screen.getByTestId('required-roles')).toHaveTextContent('estudante, instrutor, admin');
    });
  });

  describe('Unknown Route Access', () => {
    it('should allow access to unknown routes by default', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/unknown-route" userRole="instrutor" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should allow access to unknown routes even without role', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/some/random/path" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pathname', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="" userRole="instrutor" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should handle root path', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/" userRole="estudante" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should handle malformed student routes', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/" userRole="estudante" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should handle deeply nested student routes', () => {
      render(
        <TestWrapper>
          <RouteAccessTestComponent 
            pathname="/estudante/123/familia/member/456" 
            userRole="instrutor" 
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });
  });
});