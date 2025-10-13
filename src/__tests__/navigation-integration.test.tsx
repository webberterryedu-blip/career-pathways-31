import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NavigationProvider, useNavigation, usePageMetadata } from '@/contexts/NavigationContext';

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

describe('Navigation Integration Tests', () => {
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
    mockLocalStorage.getItem.mockReturnValue(null);
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
          <button 
            data-testid="navigate-programas" 
            onClick={() => navigate('/programas')}
          >
            Programas
          </button>
          <button 
            data-testid="go-back" 
            onClick={navigation.goBack}
            disabled={!navigation.canGoBack}
          >
            Go Back
          </button>
        </div>
      );
    };

    it('should track navigation history across multiple route changes', async () => {
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

      // Navigate to estudantes
      fireEvent.click(screen.getByTestId('navigate-estudantes'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-location')).toHaveTextContent('/estudantes');
        expect(screen.getByTestId('history-length')).toHaveTextContent('3');
      });

      // Navigate to programas
      fireEvent.click(screen.getByTestId('navigate-programas'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-location')).toHaveTextContent('/programas');
        expect(screen.getByTestId('history-length')).toHaveTextContent('4');
      });
    });

    it('should persist navigation history to localStorage', async () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationHistoryTest />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('navigate-estudantes'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'navigationHistory',
          expect.stringContaining('/dashboard')
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'navigationHistory',
          expect.stringContaining('/estudantes')
        );
      });
    });

    it('should restore navigation history from localStorage', () => {
      const mockHistory = ['/dashboard', '/estudantes', '/programas'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(
        <TestWrapper initialEntries={['/programas']}>
          <NavigationHistoryTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('history-length')).toHaveTextContent('3');
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    });

    it('should limit history to 10 entries', async () => {
      const longHistory = Array.from({ length: 12 }, (_, i) => `/route-${i}`);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(longHistory));

      const TestComponent = () => {
        const navigation = useNavigation();
        return <div data-testid="history-length">{navigation.navigationHistory.length}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should be limited to 10 entries
      expect(screen.getByTestId('history-length')).toHaveTextContent('10');
    });
  });

  describe('Breadcrumb Generation', () => {
    const BreadcrumbTest = ({ path }: { path: string }) => {
      const navigation = useNavigation();
      const breadcrumbs = navigation.generateBreadcrumbs(path);

      return (
        <div>
          <div data-testid="breadcrumb-count">{breadcrumbs.length}</div>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} data-testid={`breadcrumb-${index}`}>
              {crumb.label} -> {crumb.path}
            </div>
          ))}
        </div>
      );
    };

    it('should generate breadcrumbs for simple routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/dashboard" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('1');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início -> /dashboard');
    });

    it('should generate breadcrumbs for nested routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/designacoes" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('2');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início -> /dashboard');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Designações -> /designacoes');
    });

    it('should generate breadcrumbs for student profile routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/estudante/123" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('3');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início -> /dashboard');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Estudantes -> /estudantes');
      expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('Estudante 123 -> /estudante/123');
    });

    it('should generate breadcrumbs for student sub-routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/estudante/456/familia" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('4');
      expect(screen.getByTestId('breadcrumb-3')).toHaveTextContent('Família -> /estudante/456/familia');
    });

    it('should handle unknown student sub-routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/estudante/789/unknown" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('4');
      expect(screen.getByTestId('breadcrumb-3')).toHaveTextContent('unknown -> /estudante/789/unknown');
    });

    it('should generate fallback breadcrumbs for unknown routes', () => {
      render(
        <TestWrapper>
          <BreadcrumbTest path="/completely/unknown/route" />
        </TestWrapper>
      );

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('2');
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Início -> /dashboard');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('route -> /completely/unknown/route');
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
          {navigation.breadcrumbs.map((crumb, index) => (
            <div key={index} data-testid={`breadcrumb-${index}`}>
              {crumb.label}
            </div>
          ))}
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
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Home');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Custom Section');
      expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('Current Page');
    });

    it('should update both title and breadcrumbs', () => {
      const customBreadcrumbs = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings', path: '/settings' }
      ];

      render(
        <TestWrapper>
          <PageMetadataTest 
            title="Settings Page" 
            breadcrumbs={customBreadcrumbs} 
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('page-title')).toHaveTextContent('Settings Page');
      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('2');
    });
  });

  describe('Document Title Updates', () => {
    it('should update document title when page title changes', async () => {
      const TitleTest = ({ title }: { title: string }) => {
        const navigation = useNavigation();
        
        React.useEffect(() => {
          navigation.setPageTitle(title);
        }, [title, navigation]);

        return <div>Title Test</div>;
      };

      const { rerender } = render(
        <TestWrapper>
          <TitleTest title="Initial Title" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.title).toBe('Initial Title - Sistema Ministerial');
      });

      rerender(
        <TestWrapper>
          <TitleTest title="Updated Title" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.title).toBe('Updated Title - Sistema Ministerial');
      });
    });
  });

  describe('Navigation State Synchronization', () => {
    const NavigationSyncTest = () => {
      const location = useLocation();
      const navigation = useNavigation();

      return (
        <div>
          <div data-testid="location-path">{location.pathname}</div>
          <div data-testid="navigation-path">{navigation.currentPath}</div>
          <div data-testid="sync-status">
            {location.pathname === navigation.currentPath ? 'synced' : 'not-synced'}
          </div>
        </div>
      );
    };

    it('should keep navigation state synchronized with router location', async () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <NavigationSyncTest />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
        expect(screen.getByTestId('location-path')).toHaveTextContent('/dashboard');
        expect(screen.getByTestId('navigation-path')).toHaveTextContent('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const TestComponent = () => {
        const navigation = useNavigation();
        return <div data-testid="history-length">{navigation.navigationHistory.length}</div>;
      };

      // Should not throw and should initialize with empty history
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('history-length')).toHaveTextContent('1');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const NavigationTest = () => {
        const navigate = useNavigate();
        return (
          <button 
            data-testid="navigate-btn" 
            onClick={() => navigate('/test')}
          >
            Navigate
          </button>
        );
      };

      render(
        <TestWrapper>
          <NavigationTest />
        </TestWrapper>
      );

      // Should not throw even if localStorage fails
      expect(() => {
        fireEvent.click(screen.getByTestId('navigate-btn'));
      }).not.toThrow();
    });
  });

  describe('Navigation Context Provider Edge Cases', () => {
    it('should throw error when useNavigation is used outside provider', () => {
      const TestComponent = () => {
        useNavigation();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNavigation must be used within a NavigationProvider');

      consoleSpy.mockRestore();
    });

    it('should handle rapid navigation changes', async () => {
      const RapidNavigationTest = () => {
        const navigate = useNavigate();
        const navigation = useNavigation();

        const handleRapidNavigation = () => {
          navigate('/route1');
          navigate('/route2');
          navigate('/route3');
        };

        return (
          <div>
            <div data-testid="current-path">{navigation.currentPath}</div>
            <button data-testid="rapid-nav" onClick={handleRapidNavigation}>
              Rapid Navigate
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <RapidNavigationTest />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('rapid-nav'));

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/route3');
      });
    });
  });
});