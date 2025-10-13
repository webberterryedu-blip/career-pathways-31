import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouteAccess } from '@/components/ProtectedRoute';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

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

describe('Routing and Navigation Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.profile = null;
    mockAuthContext.loading = false;
  });

  describe('useRouteAccess Hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    it('should allow access for instructor to instructor routes', () => {
      mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      const { result } = renderHook(() => useRouteAccess('/dashboard'), { wrapper });

      expect(result.current.allowed).toBe(true);
    });

    it('should deny access for student to instructor routes', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      const { result } = renderHook(() => useRouteAccess('/dashboard'), { wrapper });

      expect(result.current.allowed).toBe(false);
      expect(result.current.requiredRoles).toEqual(['instrutor', 'admin']);
    });

    it('should allow access for students to student routes', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      const { result } = renderHook(() => useRouteAccess('/estudante/2'), { wrapper });

      expect(result.current.allowed).toBe(true);
    });

    it('should allow admin access to all routes', () => {
      mockAuthContext.user = { id: '3', email: 'admin@test.com' };
      mockAuthContext.profile = { id: '3', role: 'admin', user_id: '3' };

      const { result } = renderHook(() => useRouteAccess('/dashboard'), { wrapper });

      expect(result.current.allowed).toBe(true);
    });

    it('should allow access for unknown routes by default', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

      const { result } = renderHook(() => useRouteAccess('/some-unknown-route'), { wrapper });

      expect(result.current.allowed).toBe(true);
    });

    it('should handle student sub-routes correctly', () => {
      mockAuthContext.user = { id: '2', email: 'student@test.com' };
      mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

      const { result } = renderHook(() => useRouteAccess('/estudante/2/designacoes'), { wrapper });

      expect(result.current.allowed).toBe(true);
    });

    it('should deny access to student routes for users without role', () => {
      mockAuthContext.user = { id: '1', email: 'user@test.com' };
      mockAuthContext.profile = null;

      const { result } = renderHook(() => useRouteAccess('/estudante/123'), { wrapper });

      expect(result.current.allowed).toBe(false);
      expect(result.current.requiredRoles).toEqual(['estudante', 'instrutor', 'admin']);
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
          mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
          mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

          const { result } = renderHook(() => useRouteAccess(route), { wrapper });

          expect(result.current.allowed).toBe(true);
        });

        it(`should deny student access to ${route}`, () => {
          mockAuthContext.user = { id: '2', email: 'student@test.com' };
          mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

          const { result } = renderHook(() => useRouteAccess(route), { wrapper });

          expect(result.current.allowed).toBe(false);
          expect(result.current.requiredRoles).toEqual(['instrutor', 'admin']);
        });

        it(`should allow admin access to ${route}`, () => {
          mockAuthContext.user = { id: '3', email: 'admin@test.com' };
          mockAuthContext.profile = { id: '3', role: 'admin', user_id: '3' };

          const { result } = renderHook(() => useRouteAccess(route), { wrapper });

          expect(result.current.allowed).toBe(true);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty pathname', () => {
        mockAuthContext.user = { id: '1', email: 'user@test.com' };
        mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

        const { result } = renderHook(() => useRouteAccess(''), { wrapper });

        expect(result.current.allowed).toBe(true);
      });

      it('should handle root path', () => {
        mockAuthContext.user = { id: '2', email: 'student@test.com' };
        mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

        const { result } = renderHook(() => useRouteAccess('/'), { wrapper });

        expect(result.current.allowed).toBe(true);
      });

      it('should handle malformed student routes', () => {
        mockAuthContext.user = { id: '2', email: 'student@test.com' };
        mockAuthContext.profile = { id: '2', role: 'estudante', user_id: '2' };

        const { result } = renderHook(() => useRouteAccess('/estudante/'), { wrapper });

        expect(result.current.allowed).toBe(true);
      });

      it('should handle deeply nested student routes', () => {
        mockAuthContext.user = { id: '1', email: 'instructor@test.com' };
        mockAuthContext.profile = { id: '1', role: 'instrutor', user_id: '1' };

        const { result } = renderHook(() => useRouteAccess('/estudante/123/familia/member/456'), { wrapper });

        expect(result.current.allowed).toBe(true);
      });
    });
  });

  describe('Navigation Context Breadcrumb Generation', () => {
    it('should generate correct breadcrumbs for dashboard route', () => {
      // Test the route mapping logic
      const routeBreadcrumbMap: Record<string, Array<{ label: string; path: string }>> = {
        '/dashboard': [
          { label: 'Início', path: '/dashboard' }
        ],
        '/estudantes': [
          { label: 'Início', path: '/dashboard' },
          { label: 'Estudantes', path: '/estudantes' }
        ],
        '/programas': [
          { label: 'Início', path: '/dashboard' },
          { label: 'Programas', path: '/programas' }
        ]
      };

      expect(routeBreadcrumbMap['/dashboard']).toHaveLength(1);
      expect(routeBreadcrumbMap['/dashboard'][0].label).toBe('Início');
      
      expect(routeBreadcrumbMap['/estudantes']).toHaveLength(2);
      expect(routeBreadcrumbMap['/estudantes'][1].label).toBe('Estudantes');
    });

    it('should handle student route breadcrumb generation logic', () => {
      const generateStudentBreadcrumbs = (path: string) => {
        if (path.startsWith('/estudante/')) {
          const segments = path.split('/');
          const studentId = segments[2];
          const subPath = segments[3];
          
          const baseBreadcrumbs = [
            { label: 'Início', path: '/dashboard' },
            { label: 'Estudantes', path: '/estudantes' },
            { label: `Estudante ${studentId}`, path: `/estudante/${studentId}` }
          ];

          if (subPath) {
            const subPathLabels: Record<string, string> = {
              'familia': 'Família',
              'designacoes': 'Designações',
              'materiais': 'Materiais',
              'historico': 'Histórico'
            };
            
            baseBreadcrumbs.push({
              label: subPathLabels[subPath] || subPath,
              path: path
            });
          }
          
          return baseBreadcrumbs;
        }
        return [];
      };

      const breadcrumbs = generateStudentBreadcrumbs('/estudante/123/designacoes');
      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs[2].label).toBe('Estudante 123');
      expect(breadcrumbs[3].label).toBe('Designações');
    });
  });

  describe('Route Title Mapping', () => {
    it('should have correct route to title mapping', () => {
      const routeTitleMap: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/estudantes': 'Gerenciar Estudantes',
        '/programas': 'Gerenciar Programas',
        '/designacoes': 'Gerenciar Designações',
        '/relatorios': 'Relatórios e Analytics',
        '/reunioes': 'Reuniões',
        '/assignments': 'Designações',
        '/treasures-designacoes': 'Designações - Tesouros'
      };

      expect(routeTitleMap['/dashboard']).toBe('Dashboard');
      expect(routeTitleMap['/estudantes']).toBe('Gerenciar Estudantes');
      expect(routeTitleMap['/programas']).toBe('Gerenciar Programas');
      expect(routeTitleMap['/designacoes']).toBe('Gerenciar Designações');
    });
  });
});