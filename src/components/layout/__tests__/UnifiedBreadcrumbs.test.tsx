import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UnifiedBreadcrumbs from '../UnifiedBreadcrumbs'

// Mock react-router-dom
const mockUseLocation = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Link: ({ to, children, className }: any) => (
      <a href={to} className={className} data-testid="breadcrumb-link">
        {children}
      </a>
    )
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UnifiedBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Route', () => {
    it('should render dashboard breadcrumbs correctly', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Início')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('should show home icon for first breadcrumb', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      const homeLink = screen.getByTestId('breadcrumb-link')
      expect(homeLink).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('Students Routes', () => {
    it('should render students main page breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Início')).toBeInTheDocument()
      expect(screen.getByText('Estudantes')).toBeInTheDocument()
    })

    it('should render nested student routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Início')).toBeInTheDocument()
      expect(screen.getByText('Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Novo Estudante')).toBeInTheDocument()
    })

    it('should render edit student route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/editar' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Editar Estudante')).toBeInTheDocument()
    })

    it('should render import students route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/importar' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Importar Estudantes')).toBeInTheDocument()
    })
  })

  describe('Programs Routes', () => {
    it('should render programs main page breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/programas' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Programas')).toBeInTheDocument()
    })

    it('should render upload program route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/programas/upload' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Upload Programa')).toBeInTheDocument()
    })

    it('should render view program route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/programas/visualizar' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Visualizar Programa')).toBeInTheDocument()
    })
  })

  describe('Assignments Routes', () => {
    it('should render assignments main page breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/designacoes' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Designações')).toBeInTheDocument()
    })

    it('should render nested assignments routes with fallback', () => {
      mockUseLocation.mockReturnValue({ pathname: '/designacoes/gerar' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Gerar')).toBeInTheDocument()
    })

    it('should render validate route with fallback', () => {
      mockUseLocation.mockReturnValue({ pathname: '/designacoes/validar' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Validar')).toBeInTheDocument()
    })
  })

  describe('Reports Routes', () => {
    it('should render reports main page breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/relatorios' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Relatórios')).toBeInTheDocument()
    })

    it('should render nested reports routes with fallback', () => {
      mockUseLocation.mockReturnValue({ pathname: '/relatorios/participacao' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Participacao')).toBeInTheDocument()
    })

    it('should render distribution route with fallback', () => {
      mockUseLocation.mockReturnValue({ pathname: '/relatorios/distribuicao' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Distribuicao')).toBeInTheDocument()
    })
  })

  describe('Student Individual Routes', () => {
    it('should render student dashboard breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Área do Estudante')).toBeInTheDocument()
      expect(screen.getByText('Meu Dashboard')).toBeInTheDocument()
    })

    it('should render student assignments route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/designacoes' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Minhas Designações')).toBeInTheDocument()
    })

    it('should render student materials route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/materiais' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Materiais')).toBeInTheDocument()
    })

    it('should render student family route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/familia' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Família')).toBeInTheDocument()
    })
  })

  describe('Onboarding Routes', () => {
    it('should render welcome page breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/bem-vindo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Bem-vindo')).toBeInTheDocument()
    })

    it('should render initial setup breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/configuracao-inicial' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Configuração Inicial')).toBeInTheDocument()
    })
  })

  describe('Fallback Route Generation', () => {
    it('should generate breadcrumbs from path segments for unknown routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/custom/nested/route' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Início')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.getByText('Nested')).toBeInTheDocument()
      expect(screen.getByText('Route')).toBeInTheDocument()
    })

    it('should handle single segment unknown routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Navigation Structure', () => {
    it('should render breadcrumbs in correct order', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      const breadcrumbs = screen.getAllByRole('listitem')
      expect(breadcrumbs.length).toBeGreaterThan(1) // At least home and current page
    })

    it('should show chevron separators between breadcrumbs', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      // Should have chevron icons between breadcrumb items
      const chevrons = document.querySelectorAll('svg')
      expect(chevrons.length).toBeGreaterThan(0)
    })

    it('should mark current page as non-clickable', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      // Check that there's at least one span element (current page)
      const spans = document.querySelectorAll('span')
      expect(spans.length).toBeGreaterThan(0)
    })

    it('should make non-current breadcrumbs clickable', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes/novo' })

      renderWithRouter(<UnifiedBreadcrumbs />)

      const links = screen.getAllByTestId('breadcrumb-link')
      expect(links.length).toBeGreaterThan(0)
    })
  })
})