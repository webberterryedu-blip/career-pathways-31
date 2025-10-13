import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NavigationProvider, useNavigation, usePageMetadata } from '@/contexts/NavigationContext';
import ProtectedRoute, { useRouteAccess } from '@/components/ProtectedRoute';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock auth context
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

describe('Routing and Navigation Tests', () => {
  const TestWrapper: React.FC<{ 
    children: React.ReactNode; 
    initialEntries?: string[];
  }> = ({ children, initialEntries = ['/'] }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.profile = null;
    mockAuthContext.loading = false;
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Route Protection and Role-based Access Control', () => {
    it('should show loading state when authentication is loading', () => {
      mockAuthContext.loading = true;

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['instrutor']}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

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
      expect(screen.queryByText('Instructor Content')).not.toBeInTheDocument();
    });

    it('should allow admin access to restricted routes', () => {
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
  });

  describe('Navigation State Management and Persistence', () => {
    const NavigationTestComponent = () => {
      const navigation = useNavigation();
      
      return (
        <div>
          <div data-testid="current-path">{navigation.currentPath}</div>
          <div data-testid="page-title">{navigation.pageTitle}</div>
          <div data-testid="can-go-back">{navigation.canGoBack.toString()}</div>
          <div data-testid="history-length">{navigation.navigationHistory.length}</div>
          <button 
            data-testid="go-back-btn" 
            onClick={navigation.goBack}
            disabled={!navigation.canGoBack}
          >
            Go Back
          </button>
          <button 
            data-testid="clear-history-btn" 
            onClick={navigation.clearHistory}
          >
            Clear History
          </button>
        </div>
      );
    };

    it('should track current path and update navigation state', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
      expect(screen.getByTestId('page-title')).toHaveTextContent('Dashboard');
    });

    it('should persist navigation history in localStorage', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationTestComponent />
        </TestWrapper>
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'navigationHistory',
        expect.stringContaining('/dashboard')
      );
    });

    it('should restore navigation history from localStorage', () => {
      const mockHistory = ['/dashboard', '/estudantes', '/programas'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(
        <TestWrapper initialEntries={['/programas']}>
          <NavigationTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('history-length')).toHaveTextContent('3');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    });

    it('should clear navigation history when requested', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('clear-history-btn'));

      expect(screen.getByTestId('history-length')).toHaveTextContent('1');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
    });
  });

  describe('Breadcrumb Generation and Navigation History', () => {
    const BreadcrumbTestComponent = () => {
      const navigation = useNavigation();
      
      return (
        <div>
          <div data-testid="breadcrumbs-count">{navigation.breadcrumbs.length}</div>
          <div data-testid="breadcrumbs">
            {navigation.breadcrumbs.map((crumb, index) => (
              <span key={index} data-testid={`breadcrumb-${index}`}>
                {crumb.label} ({crumb.path})
              </span>
            ))}
          </div>
        </div>
      );
    };

    it('should generate correct breadcrumbs for dashboard route', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início (/dashboard)');
    });

    it('should generate correct breadcrumbs for nested routes', () => {
      render(
        <TestWrapper initialEntries={['/estudantes']}>
          <BreadcrumbTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início (/dashboard)');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Estudantes (/estudantes)');
    });

    it('should generate correct breadcrumbs for student profile routes', () => {
      render(
        <TestWrapper initialEntries={['/estudante/123']}>
          <BreadcrumbTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('3');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início (/dashboard)');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Estudantes (/estudantes)');
      expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('Estudante 123 (/estudante/123)');
    });

    it('should generate correct breadcrumbs for student sub-routes', () => {
      render(
        <TestWrapper initialEntries={['/estudante/123/designacoes']}>
          <BreadcrumbTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('4');
      expect(screen.getByTestId('breadcrumb-3')).toHaveTextContent('Designações (/estudante/123/designacoes)');
    });

    it('should handle unknown routes with fallback breadcrumbs', () => {
      render(
        <TestWrapper initialEntries={['/unknown-route']}>
          <BreadcrumbTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início (/dashboard)');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('unknown-route (/unknown-route)');
    });
  });

  describe('useRouteAccess Hook', () => {
    const RouteAccessTestComponent = ({ pathname }: { pathname?: string }) => {
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

    it('should allow access for instructor to instructor routes', () => {
      mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/dashboard" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should deny access for student to instructor routes', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/dashboard" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('false');
      expect(screen.getByTestId('required-roles')).toHaveTextContent('instrutor, admin');
    });

    it('should allow access for students to student routes', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/estudante/2" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });

    it('should allow access for unknown routes by default', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      render(
        <TestWrapper>
          <RouteAccessTestComponent pathname="/some-unknown-route" />
        </TestWrapper>
      );

      expect(screen.getByTestId('access-allowed')).toHaveTextContent('true');
    });
  });

  describe('Document Title Updates', () => {
    it('should update document title based on current route', async () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationProvider>
            <div>Test</div>
          </NavigationProvider>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.title).toBe('Dashboard - Sistema Ministerial');
      });
    });
  });

  describe('Page Metadata Management', () => {
    const PageMetadataTest = ({ title, breadcrumbs }: { 
      title?: string; 
      breadcrumbs?: Array<{ label: string; path: string }>;
    }) => {
      usePageMetadata(title, breadcrumbs);
      const navigation = useNavigation();

      return (
        <div>
          <div data-testid="page-title">{navigation.pageTitle}</div>
          <div data-testid="breadcrumb-count">{navigation.breadcrumbs.length}</div>
        </div>
      );
    };

    it('should update page title using usePageMetadata hook', () => {
      render(
        <TestWrapper>
          <PageMetadataTest title="Custom Page Title" />
        </TestWrapper>
      );

      expect(screen.getByTestId('page-title')).toHaveTextContent('Custom Page Title');
    });

    it('should update breadcrumbs using usePageMetadata hook', () => {
      const customBreadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'Custom Section', path: '/custom' },
        { label: 'Current Page', path: '/custom/page' }
      ];

      render(
        <TestWrapper>
          <PageMetadataTest breadcrumbs={customBreadcrumbs} />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('3');
    });
  });

  describe('Navigation Context Integration', () => {
    it('should provide navigation context to child components', () => {
      const TestChild = () => {
        const navigation = useNavigation();
        return <div data-testid="has-navigation">{navigation ? 'true' : 'false'}</div>;
      };

      render(
        <TestWrapper>
          <TestChild />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-navigation')).toHaveTextContent('true');
    });

    it('should throw error when useNavigation is used outside provider', () => {
      const TestChild = () => {
        try {
          useNavigation();
          return <div>No error</div>;
        } catch (error) {
          return <div data-testid="navigation-error">Error caught</div>;
        }
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestChild />);
      }).toThrow('useNavigation must be used within a NavigationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Navigation History Management', () => {
    const NavigationHistoryTest = () => {
      const navigate = useNavigate();
      const location = useLocation();
      const navigation = useNavigation();

      return (
        <div>
          <div data-testid="current-location">{location.pathname}</div>
          <div data-testid="history-length">{navigation.navigationHistory.length}</div>
          <div data-testid="can-go-back">{navigation.canGoBack.toString()}</div>
          
          <button 
            data-testid="navigate-dashboard" 
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
          <button 
            data-testid="navigate-estudantes" 
            onClick={() => navigate('/estudantes')}
          >
            Estudantes
          </button>
        </div>
      );
    };

    it('should track navigation history across route changes', async () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <NavigationHistoryTest />
        </TestWrapper>
      );

      // Initial state
      expect(screen.getByTestId('history-length')).toHaveTextContent('1');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');

      // Navigate to dashboard
      fireEvent.click(screen.getByTestId('navigate-dashboard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-location')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('history-length')).toHaveTextContent('2');
        expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
      });
    });
  });
});