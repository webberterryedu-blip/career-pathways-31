import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationArea from '../NotificationArea'

// Mock timers
vi.useFakeTimers()

describe('NotificationArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should render initial notifications', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        expect(screen.getByText('Sistema Atualizado')).toBeInTheDocument()
        expect(screen.getByText('Nova Designação Disponível')).toBeInTheDocument()
      })
    })

    it('should render notification with correct content', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        expect(screen.getByText('Nova versão do sistema com melhorias na navegação.')).toBeInTheDocument()
        expect(screen.getByText('Você tem uma nova designação para a semana de 15/12.')).toBeInTheDocument()
      })
    })
  })

  describe('Notification Types', () => {
    it('should render info notification with correct styling', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const infoNotification = screen.getByText('Sistema Atualizado').closest('div')
        expect(infoNotification).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
      })
    })

    it('should render assignment notification with correct styling', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const assignmentNotification = screen.getByText('Nova Designação Disponível').closest('div')
        expect(assignmentNotification).toHaveClass('bg-purple-50', 'border-purple-200', 'text-purple-800')
      })
    })

    it('should render correct icons for different notification types', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        // Icons should be present
        const icons = document.querySelectorAll('svg')
        expect(icons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Notification Actions', () => {
    it('should render action button for notifications with actions', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const actionButton = screen.getByText('Ver Designação')
        expect(actionButton).toBeInTheDocument()
      })
    })

    it('should handle action button clicks', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      render(<NotificationArea />)

      await waitFor(() => {
        const actionButton = screen.getByText('Ver Designação')
        fireEvent.click(actionButton)
        expect(consoleSpy).toHaveBeenCalledWith('Navigate to assignment')
      })

      consoleSpy.mockRestore()
    })

    it('should not render action button for notifications without actions', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const infoNotification = screen.getByText('Sistema Atualizado').closest('div')
        const actionButton = infoNotification?.querySelector('button[class*="bg-white/20"]')
        expect(actionButton).not.toBeInTheDocument()
      })
    })
  })

  describe('Dismissible Notifications', () => {
    it('should render close button for dismissible notifications', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /fechar/i })
        expect(closeButtons).toHaveLength(2) // Both notifications are dismissible
      })
    })

    it('should remove notification when close button is clicked', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const closeButton = screen.getAllByRole('button', { name: /fechar/i })[0]
        fireEvent.click(closeButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Sistema Atualizado')).not.toBeInTheDocument()
      })
    })

    it('should keep other notifications when one is dismissed', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const closeButton = screen.getAllByRole('button', { name: /fechar/i })[0]
        fireEvent.click(closeButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Nova Designação Disponível')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-dismiss Functionality', () => {
    it('should auto-dismiss notifications with duration', async () => {
      render(<NotificationArea />)

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Sistema Atualizado')).toBeInTheDocument()
      })

      // Fast-forward time to trigger auto-dismiss
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.queryByText('Sistema Atualizado')).not.toBeInTheDocument()
      })
    })

    it('should not auto-dismiss persistent notifications', async () => {
      render(<NotificationArea />)

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Nova Designação Disponível')).toBeInTheDocument()
      })

      // Fast-forward time
      vi.advanceTimersByTime(10000)

      await waitFor(() => {
        // Persistent notification should still be there
        expect(screen.getByText('Nova Designação Disponível')).toBeInTheDocument()
      })
    })
  })

  describe('Timestamp Display', () => {
    it('should display relative timestamps', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        expect(screen.getByText('agora')).toBeInTheDocument()
      })
    })

    it('should format timestamps correctly', async () => {
      // Mock Date to test different time formats
      const mockDate = new Date('2023-12-01T10:00:00Z')
      vi.setSystemTime(mockDate)

      render(<NotificationArea />)

      await waitFor(() => {
        const timestamps = screen.getAllByText('agora')
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Empty State', () => {
    it('should return null when no notifications', async () => {
      render(<NotificationArea />)

      // Dismiss all notifications
      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /fechar/i })
        closeButtons.forEach(button => fireEvent.click(button))
      })

      // Fast-forward to auto-dismiss timed notifications
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        const container = document.querySelector('.fixed.top-0')
        expect(container).not.toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive container styling', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const container = document.querySelector('.fixed.top-0')
        expect(container).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'pointer-events-none')
      })
    })

    it('should have responsive notification styling', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const notification = screen.getByText('Sistema Atualizado').closest('div')
        expect(notification).toHaveClass('pointer-events-auto', 'rounded-lg', 'border', 'p-4', 'shadow-lg')
      })
    })

    it('should have responsive spacing', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const contentContainer = document.querySelector('.max-w-7xl')
        expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'pt-4')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for close buttons', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /fechar/i })
        closeButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label', expect.stringContaining('Fechar'))
        })
      })
    })

    it('should have proper focus management', async () => {
      render(<NotificationArea />)

      await waitFor(() => {
        const closeButton = screen.getAllByRole('button', { name: /fechar/i })[0]
        expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2')
      })
    })
  })
})