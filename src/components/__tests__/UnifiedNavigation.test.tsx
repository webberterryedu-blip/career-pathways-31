import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UnifiedNavigation from '../UnifiedNavigation'
import { useAuth } from '@/contexts/AuthContext'

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock the UnifiedNotifications component
vi.mock('../UnifiedNotifications', () => ({
  default: () => <div data-testid="unified-notifications">Notifications</div>
}))

// Mock react-router-dom
const mockUseLocation = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Link: ({ to, children, className }: any) => (
      <a href={to} className={className} data-testid="nav-link">
        {children}
      </a>
    )
  }
})

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UnifiedNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
  })

  describe('Unauthenticated State', () => {
    it('should return null when no profile', () => {
      mockUseAuth.mockReturnValue({
        profile: null
      })

      const { container } = renderWithRouter(<UnifiedNavigation />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Admin Role Navigation', () => {
    const mockAdminProfile = {
      id: '1',
      nome: 'Admin User',
      role: 'admin' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockAdminProfile
      })
    })

    it('should render instructor navigation for admin role', () => {
      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Programas')).toBeInTheDocument()
      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Reuniões')).toBeInTheDocument()
    })

    it('should show assignment status indicators', () => {
      renderWithRouter(<UnifiedNavigation />)

      // Should show pending assignments badge
      const pendingBadge = screen.getByText('3')
      expect(pendingBadge).toBeInTheDocument()

      // Should show overdue assignments badge
      const overdueBadge = screen.getByText('1')
      expect(overdueBadge).toBeInTheDocument()
    })
  })

  describe('Instructor Role Navigation', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should render instructor navigation items', () => {
      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Programas')).toBeInTheDocument()
      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Reuniões')).toBeInTheDocument()
      expect(screen.getByText('Equidade')).toBeInTheDocument()
    })

    it('should show quick action buttons', () => {
      renderWithRouter(<UnifiedNavigation />)

      const quickActionButtons = screen.getAllByTitle(/tooltip/i)
      expect(quickActionButtons.length).toBeGreaterThan(0)
    })

    it('should handle quick action clicks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      renderWithRouter(<UnifiedNavigation />)

      const quickActionButton = screen.getByTitle('Adicionar Estudante')
      fireEvent.click(quickActionButton)

      expect(consoleSpy).toHaveBeenCalledWith('Add student')
      consoleSpy.mockRestore()
    })
  })

  describe('Student Role Navigation', () => {
    const mockStudentProfile = {
      id: '123',
      nome: 'Student User',
      role: 'estudante' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockStudentProfile
      })
    })

    it('should render student navigation items', () => {
      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByText('Meu Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Minhas Designações')).toBeInTheDocument()
      expect(screen.getByText('Materiais')).toBeInTheDocument()
      expect(screen.getByText('Família')).toBeInTheDocument()
      expect(screen.getByText('Histórico')).toBeInTheDocument()
    })

    it('should use student-specific routes', () => {
      renderWithRouter(<UnifiedNavigation />)

      const dashboardLink = screen.getByText('Meu Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/estudante/123')

      const assignmentsLink = screen.getByText('Minhas Designações').closest('a')
      expect(assignmentsLink).toHaveAttribute('href', '/estudante/123/designacoes')
    })
  })

  describe('Active State Detection', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should highlight active navigation item', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      renderWithRouter(<UnifiedNavigation />)

      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toHaveClass('shadow-sm') // Active state styling
    })

    it('should detect nested route active states', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedNavigation />)

      const estudantesButton = screen.getByText('Estudantes').closest('button')
      expect(estudantesButton).toHaveClass('shadow-sm')
    })

    it('should show active indicator line', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      renderWithRouter(<UnifiedNavigation />)

      const activeIndicator = document.querySelector('.absolute.bottom-0')
      expect(activeIndicator).toHaveClass('absolute', 'bottom-0', 'left-0', 'right-0', 'h-0.5', 'bg-blue-600')
    })
  })

  describe('Status Indicators', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should show status indicators for different states', () => {
      renderWithRouter(<UnifiedNavigation />)

      // Check for different status indicators
      const statusIndicators = screen.getAllByTitle(/Status:/i)
      expect(statusIndicators.length).toBeGreaterThan(0)
    })

    it('should show error status for overdue assignments', () => {
      renderWithRouter(<UnifiedNavigation />)

      const errorIndicator = screen.getByTitle('Status: error')
      expect(errorIndicator).toHaveClass('bg-red-500')
    })

    it('should show pending status indicators', () => {
      renderWithRouter(<UnifiedNavigation />)

      const pendingIndicator = screen.getByTitle('Status: pending')
      expect(pendingIndicator).toHaveClass('bg-yellow-500')
    })
  })

  describe('Mobile Navigation', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should render mobile menu button', () => {
      renderWithRouter(<UnifiedNavigation />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should toggle mobile menu on button click', () => {
      renderWithRouter(<UnifiedNavigation />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      
      // Initially closed - check for mobile menu container
      const mobileMenuContainer = document.querySelector('.overflow-hidden')
      expect(mobileMenuContainer).toHaveClass('max-h-0', 'opacity-0')

      // Click to open
      fireEvent.click(menuButton)
      // After click, menu should expand
      expect(mobileMenuContainer).toHaveClass('max-h-screen', 'opacity-100')
    })

    it('should close mobile menu when navigation item is clicked', () => {
      renderWithRouter(<UnifiedNavigation />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)

      const navItem = screen.getByText('Estudantes')
      fireEvent.click(navItem)

      const mobileMenuContainer = document.querySelector('.overflow-hidden')
      expect(mobileMenuContainer).toHaveClass('max-h-0', 'opacity-0')
    })

    it('should show mobile-specific styling', () => {
      renderWithRouter(<UnifiedNavigation />)

      const mobileNav = document.querySelector('.md\\:hidden')
      expect(mobileNav).toHaveClass('md:hidden')

      const desktopNav = document.querySelector('.hidden.md\\:flex')
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
    })
  })

  describe('Brand and Logo', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should render brand logo and name', () => {
      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByText('Sistema Ministerial')).toBeInTheDocument()
      
      const logo = document.querySelector('.w-8.h-8.bg-blue-600')
      expect(logo).toHaveClass('w-8', 'h-8', 'bg-blue-600', 'rounded-lg')
    })

    it('should render logo on both desktop and mobile', () => {
      renderWithRouter(<UnifiedNavigation />)

      const logos = document.querySelectorAll('.w-8.h-8.bg-blue-600')
      expect(logos.length).toBeGreaterThan(0)
    })
  })

  describe('Notifications Integration', () => {
    const mockInstructorProfile = {
      id: '1',
      nome: 'Instructor User',
      role: 'instrutor' as const
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: mockInstructorProfile
      })
    })

    it('should render notifications component', () => {
      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByTestId('unified-notifications')).toBeInTheDocument()
    })

    it('should render notifications on both desktop and mobile', () => {
      renderWithRouter(<UnifiedNavigation />)

      const notifications = screen.getAllByTestId('unified-notifications')
      expect(notifications).toHaveLength(2) // Desktop and mobile
    })
  })

  describe('Unknown Role Handling', () => {
    it('should handle unknown role gracefully', () => {
      mockUseAuth.mockReturnValue({
        profile: {
          id: '1',
          nome: 'Unknown User',
          role: 'unknown' as any
        }
      })

      renderWithRouter(<UnifiedNavigation />)

      expect(screen.getByText('Role não reconhecido: unknown')).toBeInTheDocument()
    })
  })
})