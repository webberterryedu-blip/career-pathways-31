import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UnifiedLayout from '../UnifiedLayout'
import { useAuth } from '@/contexts/AuthContext'

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock the child components
vi.mock('@/components/UnifiedNavigation', () => ({
  default: () => <div data-testid="unified-navigation">Navigation</div>
}))

vi.mock('../UnifiedBreadcrumbs', () => ({
  default: () => <div data-testid="unified-breadcrumbs">Breadcrumbs</div>
}))

vi.mock('../PageHeader', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

vi.mock('../NotificationArea', () => ({
  default: () => <div data-testid="notification-area">Notifications</div>
}))

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UnifiedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        loading: true
      })

      renderWithRouter(<UnifiedLayout />)

      const loadingSpinner = screen.getByRole('status')
      expect(loadingSpinner).toBeInTheDocument()
      expect(loadingSpinner).toHaveClass('animate-spin', 'rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-primary')
    })

    it('should have correct loading container styles', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        loading: true
      })

      renderWithRouter(<UnifiedLayout />)

      const loadingContainer = screen.getByRole('status').parentElement
      expect(loadingContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50')
    })
  })

  describe('Unauthenticated State', () => {
    it('should return null when no profile and not loading', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        loading: false
      })

      const { container } = renderWithRouter(<UnifiedLayout />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Authenticated State', () => {
    const mockProfile = {
      id: '1',
      nome: 'Test User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        loading: false
      })
    })

    it('should render all layout components when authenticated', () => {
      renderWithRouter(<UnifiedLayout />)

      expect(screen.getByTestId('notification-area')).toBeInTheDocument()
      expect(screen.getByTestId('unified-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('unified-breadcrumbs')).toBeInTheDocument()
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    it('should have correct main layout structure', () => {
      renderWithRouter(<UnifiedLayout />)

      const mainContainer = screen.getByRole('main')
      expect(mainContainer).toHaveClass('flex-1', 'min-w-0', 'flex', 'flex-col')
    })

    it('should render sidebar on desktop', () => {
      renderWithRouter(<UnifiedLayout />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('hidden', 'lg:flex', 'lg:flex-col', 'w-64')
    })

    it('should render children content', () => {
      renderWithRouter(
        <UnifiedLayout>
          <div data-testid="test-content">Test Content</div>
        </UnifiedLayout>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    const mockProfile = {
      id: '1',
      nome: 'Test User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        loading: false
      })
    })

    it('should hide sidebar on mobile screens', () => {
      renderWithRouter(<UnifiedLayout />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('hidden', 'lg:flex')
    })

    it('should have responsive main content area', () => {
      renderWithRouter(<UnifiedLayout />)

      const contentArea = document.querySelector('.max-w-7xl')
      expect(contentArea).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'py-6', 'sm:px-6', 'lg:px-8')
    })

    it('should have responsive breadcrumb container', () => {
      renderWithRouter(<UnifiedLayout />)

      const breadcrumbContainer = document.querySelector('.bg-white.border-b')
      expect(breadcrumbContainer).toHaveClass('bg-white', 'border-b', 'border-gray-200', 'px-4', 'py-2')
    })
  })

  describe('Role-based Navigation', () => {
    it('should pass profile to sidebar content', async () => {
      const mockProfile = {
        id: '1',
        nome: 'Test User',
        role: 'instrutor' as const
      }

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        loading: false
      })

      renderWithRouter(<UnifiedLayout />)

      // Verify that the sidebar content is rendered (which uses the profile)
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })

    it('should display user info in sidebar', async () => {
      const mockProfile = {
        id: '1',
        nome: 'João Silva',
        role: 'instrutor' as const
      }

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        loading: false
      })

      renderWithRouter(<UnifiedLayout />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('instrutor')).toBeInTheDocument()
      })
    })
  })

  describe('Page Title Updates', () => {
    const mockProfile = {
      id: '1',
      nome: 'Test User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        loading: false
      })
    })

    it('should update page context based on route', async () => {
      // Mock location for dashboard
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useLocation: () => ({ pathname: '/dashboard' })
        }
      })

      renderWithRouter(<UnifiedLayout />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Visão geral do sistema')).toBeInTheDocument()
      })
    })
  })
})