import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimingInterface from '../TimingInterface';

interface TimingSession {
  id: string;
  assignmentId: string;
  partTitle: string;
  studentName: string;
  assistantName?: string;
  allocatedTime: number;
  actualTime?: number;
  startTime?: Date;
  endTime?: Date;
  status: 'pending' | 'active' | 'completed' | 'overtime';
  notes?: string;
}

describe('TimingInterface', () => {
  const mockSessions: TimingSession[] = [
    {
      id: 'session-1',
      assignmentId: 'assignment-1',
      partTitle: 'Bible Reading',
      studentName: 'John Doe',
      allocatedTime: 240, // 4 minutes
      status: 'pending'
    },
    {
      id: 'session-2',
      assignmentId: 'assignment-2',
      partTitle: 'Starting a Conversation',
      studentName: 'Jane Smith',
      assistantName: 'Mary Johnson',
      allocatedTime: 180, // 3 minutes
      status: 'pending'
    }
  ];

  const mockOnSessionUpdate = vi.fn();
  const mockOnTimingComplete = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders session list correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    expect(screen.getByText('Bible Reading')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Starting a Conversation')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith e Mary Johnson')).toBeInTheDocument();
  });

  it('displays allocated time correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    expect(screen.getByText('Tempo: 4:00')).toBeInTheDocument();
    expect(screen.getByText('Tempo: 3:00')).toBeInTheDocument();
  });

  it('starts timing session correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    expect(mockOnSessionUpdate).toHaveBeenCalledWith('session-1', {
      status: 'active',
      startTime: expect.any(Date)
    });

    // Should show active timer display
    expect(screen.getByText('Bible Reading')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('updates timer display as time progresses', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance time by 90 seconds
    act(() => {
      vi.advanceTimersByTime(90000);
    });

    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('handles pause and resume correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    // Pause
    fireEvent.click(screen.getByText('Pausar'));

    // Advance time while paused
    act(() => {
      vi.advanceTimersByTime(30000); // 30 seconds
    });

    // Time should still show 1:00 (paused)
    expect(screen.getByText('1:00')).toBeInTheDocument();

    // Resume
    fireEvent.click(screen.getByText('Continuar'));

    // Advance time again
    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    // Should now show 2:00
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('resets timer correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(120000); // 2 minutes
    });

    expect(screen.getByText('2:00')).toBeInTheDocument();

    // Reset
    fireEvent.click(screen.getByText('Reiniciar'));

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(mockOnSessionUpdate).toHaveBeenCalledWith('session-1', {
      startTime: expect.any(Date)
    });
  });

  it('completes timing session correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(180000); // 3 minutes
    });

    // Stop timing
    fireEvent.click(screen.getByText('Finalizar'));

    expect(mockOnSessionUpdate).toHaveBeenCalledWith('session-1', {
      status: 'completed',
      endTime: expect.any(Date),
      actualTime: 180
    });

    expect(mockOnTimingComplete).toHaveBeenCalledWith('session-1', 180);
  });

  it('shows progress bar correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance to 50% of allocated time (2 minutes out of 4)
    act(() => {
      vi.advanceTimersByTime(120000);
    });

    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows time warnings correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance to 90% of allocated time (3:36 out of 4:00)
    act(() => {
      vi.advanceTimersByTime(216000);
    });

    expect(screen.getByText('Restam 0:24')).toBeInTheDocument();

    // Advance to 95% (3:48 out of 4:00)
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    expect(screen.getByText('Tempo quase esgotado')).toBeInTheDocument();
  });

  it('shows overtime warning', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance beyond allocated time (5 minutes out of 4)
    act(() => {
      vi.advanceTimersByTime(300000);
    });

    expect(screen.getByText('Excedeu em 1:00')).toBeInTheDocument();
  });

  it('prevents starting multiple sessions simultaneously', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start first session
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Try to start second session - button should be disabled
    expect(startButtons[1]).toBeDisabled();
  });

  it('displays completed sessions correctly', () => {
    const completedSessions = [
      {
        ...mockSessions[0],
        status: 'completed' as const,
        actualTime: 250 // 4:10 (overtime)
      }
    ];

    render(
      <TimingInterface
        sessions={completedSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('4:10')).toBeInTheDocument();
    expect(screen.getByText('(+0:10)')).toBeInTheDocument(); // Overtime indicator
  });

  it('shows meeting summary for completed sessions', () => {
    const completedSessions = [
      {
        ...mockSessions[0],
        status: 'completed' as const,
        actualTime: 240
      },
      {
        ...mockSessions[1],
        status: 'completed' as const,
        actualTime: 180
      }
    ];

    render(
      <TimingInterface
        sessions={completedSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    expect(screen.getByText('Resumo da Reunião')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument(); // Parts completed
    expect(screen.getByText('7:00')).toBeInTheDocument(); // Total time (4:00 + 3:00)
  });

  it('handles session switching correctly', () => {
    render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start first session
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Start second session (should stop first one)
    fireEvent.click(startButtons[1]);

    // Should have called onSessionUpdate for stopping first session
    expect(mockOnSessionUpdate).toHaveBeenCalledWith('session-1', {
      status: 'completed',
      endTime: expect.any(Date),
      actualTime: 60
    });

    // Should have called onTimingComplete for first session
    expect(mockOnTimingComplete).toHaveBeenCalledWith('session-1', 60);

    // Should have started second session
    expect(mockOnSessionUpdate).toHaveBeenCalledWith('session-2', {
      status: 'active',
      startTime: expect.any(Date)
    });
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(
      <TimingInterface
        sessions={mockSessions}
        onSessionUpdate={mockOnSessionUpdate}
        onTimingComplete={mockOnTimingComplete}
      />
    );

    // Start timing
    const startButtons = screen.getAllByText('Iniciar');
    fireEvent.click(startButtons[0]);

    // Unmount component
    unmount();

    // Timer should be cleaned up (no errors should occur)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // No additional calls should be made after unmount
    expect(mockOnSessionUpdate).toHaveBeenCalledTimes(1);
  });
});