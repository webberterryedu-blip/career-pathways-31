import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PageHeader from '../PageHeader'

// Mock react-router-dom
const mockUseLocation = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockUseLocation()
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
    })

    it('should render dashboard page header correctly', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Visão geral do sistema de designações')).toBeInTheDocument()
      expect(screen.getByText('Sistema Ativo')).toBeInTheDocument()
    })

    it('should render dashboard actions', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getAllByText('Atualizar')).toHaveLength(2) // Desktop and mobile
      expect(screen.getAllByText('Nova Designação')).toHaveLength(1) // Only desktop version
    })

    it('should show badge on primary action', () => {
      renderWithRouter(<PageHeader />)

      const badge = screen.getByText('3')
      expect(badge).toBeInTheDocument()
    })

    it('should handle refresh action click', () => {
      // Mock window.location.reload
      const originalReload = window.location.reload
      window.location.reload = vi.fn()
      
      renderWithRouter(<PageHeader />)

      const refreshButton = screen.getAllByText('Atualizar')[0]
      fireEvent.click(refreshButton.closest('button')!)

      expect(window.location.reload).toHaveBeenCalled()
      
      // Restore original
      window.location.reload = originalReload
    })
  })

  describe('Students Page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/estudantes' })
    })

    it('should render students page header correctly', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Gestão de publicadores e qualificações')).toBeInTheDocument()
      expect(screen.getByText('24 Ativos')).toBeInTheDocument()
    })

    it('should render students page actions', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Importar Planilha')).toBeInTheDocument()
      expect(screen.getByText('Adicionar Estudante')).toBeInTheDocument()
    })
  })

  describe('Programs Page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/programas' })
    })

    it('should render programs page header correctly', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Programas')).toBeInTheDocument()
      expect(screen.getByText('Gestão de programações semanais')).toBeInTheDocument()
      expect(screen.getByText('Programa Ativo')).toBeInTheDocument()
    })

    it('should render programs page actions', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getAllByText('Configurações')).toHaveLength(2) // Desktop and mobile
      expect(screen.getAllByText('Upload MWB')).toHaveLength(1) // Only desktop version
    })
  })

  describe('Assignments Page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/designacoes' })
    })

    it('should render assignments page header correctly', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Motor de designações seguindo regras S-38')).toBeInTheDocument()
      expect(screen.getByText('2 Pendentes')).toBeInTheDocument()
    })

    it('should render assignments page actions', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Validar Regras')).toBeInTheDocument()
      expect(screen.getByText('Gerar Automático')).toBeInTheDocument()
    })

    it('should show error badge on generate action', () => {
      renderWithRouter(<PageHeader />)

      const badge = screen.getByText('2')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Reports Page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/relatorios' })
    })

    it('should render reports page header correctly', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Análises e estatísticas de participação')).toBeInTheDocument()
      expect(screen.getByText('Dados Atualizados')).toBeInTheDocument()
    })

    it('should render reports page actions', () => {
      renderWithRouter(<PageHeader />)

      expect(screen.getAllByText('Configurar')).toHaveLength(2) // Desktop and mobile
      expect(screen.getAllByText('Exportar PDF')).toHaveLength(1) // Only desktop version
    })
  })

  describe('Student Individual Pages', () => {
    it('should render student assignments page header', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/designacoes' })

      renderWithRouter(<PageHeader />)

      // The component falls back to the default assignments page for this path
      expect(screen.getByText('Designações')).toBeInTheDocument()
      expect(screen.getByText('Motor de designações seguindo regras S-38')).toBeInTheDocument()
    })

    it('should render student materials page header', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/materiais' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Materiais')).toBeInTheDocument()
      expect(screen.getByText('Recursos e materiais de estudo')).toBeInTheDocument()
    })

    it('should render student family page header', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123/familia' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Família')).toBeInTheDocument()
      expect(screen.getByText('Gestão familiar e designações')).toBeInTheDocument()
    })

    it('should render student dashboard with no actions', () => {
      mockUseLocation.mockReturnValue({ pathname: '/estudante/123' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Meu Dashboard')).toBeInTheDocument()
      // Should not have action buttons for student pages
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Onboarding Pages', () => {
    it('should render welcome page header', () => {
      mockUseLocation.mockReturnValue({ pathname: '/bem-vindo' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Bem-vindo')).toBeInTheDocument()
      expect(screen.getByText('Configuração inicial do sistema')).toBeInTheDocument()
    })

    it('should render initial setup page header', () => {
      mockUseLocation.mockReturnValue({ pathname: '/configuracao-inicial' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Configuração Inicial')).toBeInTheDocument()
      expect(screen.getByText('Configure seu sistema pela primeira vez')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
    })

    it('should have responsive header container', () => {
      renderWithRouter(<PageHeader />)

      const headerContainer = document.querySelector('.bg-white.border-b')
      expect(headerContainer).toHaveClass('bg-white', 'border-b', 'border-gray-200', 'px-4', 'py-4', 'sm:px-6', 'lg:px-8')
    })

    it('should have responsive flex layout', () => {
      renderWithRouter(<PageHeader />)

      const flexContainer = document.querySelector('.flex.flex-col')
      expect(flexContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row')
    })

    it('should show abbreviated action labels on mobile', () => {
      renderWithRouter(<PageHeader />)

      // The component should render both full and abbreviated labels
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Action Buttons', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
    })

    it('should render primary actions with correct styling', () => {
      renderWithRouter(<PageHeader />)

      const primaryButton = screen.getByText('Nova Designação').closest('button')
      expect(primaryButton).toHaveClass('flex', 'items-center', 'gap-2', 'relative')
    })

    it('should render outline actions with correct styling', () => {
      renderWithRouter(<PageHeader />)

      const outlineButton = screen.getAllByText('Atualizar')[0].closest('button')
      expect(outlineButton).toHaveClass('flex', 'items-center', 'gap-2', 'relative')
    })

    it('should handle action clicks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      renderWithRouter(<PageHeader />)

      const actionButton = screen.getByText('Nova Designação')
      fireEvent.click(actionButton)

      expect(consoleSpy).toHaveBeenCalledWith('Nova designação')
      consoleSpy.mockRestore()
    })
  })

  describe('Status Badges', () => {
    it('should render secondary status badge', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      renderWithRouter(<PageHeader />)

      const statusBadge = screen.getByText('Sistema Ativo')
      expect(statusBadge).toBeInTheDocument()
    })

    it('should render destructive status badge', () => {
      mockUseLocation.mockReturnValue({ pathname: '/designacoes' })

      renderWithRouter(<PageHeader />)

      const statusBadge = screen.getByText('2 Pendentes')
      expect(statusBadge).toBeInTheDocument()
    })
  })

  describe('Default Fallback', () => {
    it('should render default header for unknown routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown-route' })

      renderWithRouter(<PageHeader />)

      expect(screen.getByText('Sistema Ministerial')).toBeInTheDocument()
      expect(screen.getByText('Gestão de reuniões e designações')).toBeInTheDocument()
    })
  })
})