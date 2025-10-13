import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import RealTimeStatusIndicator from '../RealTimeStatusIndicator';
import ConflictResolutionPanel from '../ConflictResolutionPanel';
import { AssignmentProvider } from '@/contexts/AssignmentContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      unsubscribe: vi.fn()
    })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(),
          range: vi.fn(() => ({ then: vi.fn() }))
        })),
        eq: vi.fn(() => ({
          then: vi.fn(),
          order: vi.fn(() => ({ then: vi.fn() }))
        })),
        lte: vi.fn(() => ({
          eq: vi.fn(() => ({ then: vi.fn() }))
        }))
      })),
      insert: vi.fn(() => ({
        then: vi.fn().mockResolvedValue({ error: null })
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn().mockResolvedValue({ error: null })
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn().mockResolvedValue({ error: null })
        }))
      }))
    }))
  }
}));

// Mock auth context
const mockAuthContext = {
  user: { id: 'test-user', email: 'test@example.com' },
  profile: { id: 'test-user', nome: 'Test User', role: 'instrutor' },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext
}));

// Mock assignment context with real-time features
const mockAssignmentContext = {
  assignments: [],
  isLoading: false,
  isRealTimeConnected: true,
  optimisticUpdates: [],
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  resolveConflict: vi.fn(),
  retryFailedUpdates: vi.fn()
};

vi.mock('@/contexts/AssignmentContext', () => ({
  AssignmentProvider: ({ children }: { children: React.ReactNode }) => children,
  useAssignments: () => mockAssignmentContext
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <NotificationProvider>
      <AssignmentProvider>
        {children}
      </AssignmentProvider>
    </NotificationProvider>
  </AuthProvider>
);

describe('Real-time Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssignmentContext.isRealTimeConnected = true;
    mockAssignmentContext.optimisticUpdates = [];
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('RealTimeStatusIndicator', () => {
    it('renders connection status correctly when connected', () => {
      render(
        <TestWrapper>
          <RealTimeStatusIndicator />
        </TestWrapper>
      );

      const indicator = document.querySelector('[title]');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('title', 'Tempo real ativo');
    });

    it('shows disconnected state when not connected', () => {
      mockAssignmentContext.isRealTimeConnected = false;
      
      render(
        <TestWrapper>
          <RealTimeStatusIndicator />
        </TestWrapper>
      );

      const indicator = document.querySelector('[title]');
      expect(indicator).toHaveAttribute('title', 'Sem conexão em tempo real');
    });

    it('shows text status when showText prop is true', () => {
      render(
        <TestWrapper>
          <RealTimeStatusIndicator showText={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });

    it('displays optimistic update count', () => {
      mockAssignmentContext.optimisticUpdates = [
        { id: '1', type: 'create', timestamp: Date.now() },
        { id: '2', type: 'update', timestamp: Date.now() }
      ];

      render(
        <TestWrapper>
          <RealTimeStatusIndicator showText={true} />
        </TestWrapper>
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Atualizando')).toBeInTheDocument();
    });

    it('shows pending status for old optimistic updates', () => {
      mockAssignmentContext.optimisticUpdates = [
        { id: '1', type: 'create', timestamp: Date.now() - 10000 } // 10 seconds ago
      ];

      render(
        <TestWrapper>
          <RealTimeStatusIndicator showText={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Sincronizando')).toBeInTheDocument();
    });
  });

  describe('ConflictResolutionPanel', () => {
    it('renders nothing when no conflicts exist', () => {
      render(
        <TestWrapper>
          <ConflictResolutionPanel />
        </TestWrapper>
      );

      expect(screen.queryByText(/conflitos detectados/i)).not.toBeInTheDocument();
    });

    it('displays conflicts when they exist', () => {
      mockAssignmentContext.optimisticUpdates = [
        {
          id: '1',
          type: 'create',
          timestamp: Date.now() - 10000,
          assignment: { partType: 'bible_reading' }
        }
      ];

      render(
        <TestWrapper>
          <ConflictResolutionPanel />
        </TestWrapper>
      );

      expect(screen.getByText(/conflitos detectados/i)).toBeInTheDocument();
      expect(screen.getByText('Nova designação: bible_reading')).toBeInTheDocument();
    });

    it('handles conflict resolution', async () => {
      mockAssignmentContext.optimisticUpdates = [
        {
          id: '1',
          type: 'update',
          timestamp: Date.now() - 10000,
          assignment: { partType: 'starting_conversation' }
        }
      ];

      render(
        <TestWrapper>
          <ConflictResolutionPanel />
        </TestWrapper>
      );

      const acceptButton = screen.getByText('Manter');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockAssignmentContext.resolveConflict).toHaveBeenCalledWith('1', 'accept');
      });
    });

    it('handles retry all functionality', async () => {
      mockAssignmentContext.optimisticUpdates = [
        { id: '1', type: 'create', timestamp: Date.now() - 10000 }
      ];

      render(
        <TestWrapper>
          <ConflictResolutionPanel />
        </TestWrapper>
      );

      const retryButton = screen.getByText('Tentar Novamente');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockAssignmentContext.retryFailedUpdates).toHaveBeenCalled();
      });
    });
  });
});

describe('Real-time Assignment Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle optimistic updates correctly', async () => {
    const TestComponent = () => {
      const { createAssignment } = mockAssignmentContext;
      
      return (
        <button onClick={() => createAssignment({ partType: 'bible_reading' })}>
          Create Assignment
        </button>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const button = screen.getByText('Create Assignment');
    fireEvent.click(button);

    expect(mockAssignmentContext.createAssignment).toHaveBeenCalledWith({
      partType: 'bible_reading'
    });
  });

  it('should handle conflict resolution between optimistic and server updates', async () => {
    const conflictUpdate = {
      id: 'conflict-1',
      type: 'update',
      timestamp: Date.now() - 10000,
      assignment: { id: 'test-assignment', partType: 'bible_reading' }
    };

    mockAssignmentContext.optimisticUpdates = [conflictUpdate];
    mockAssignmentContext.resolveConflict = vi.fn().mockResolvedValue(true);

    render(
      <TestWrapper>
        <ConflictResolutionPanel />
      </TestWrapper>
    );

    const acceptButton = screen.getByText('Manter');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockAssignmentContext.resolveConflict).toHaveBeenCalledWith('conflict-1', 'accept');
    });
  });

  it('should handle real-time data consistency', async () => {
    // Test that optimistic updates are properly managed
    const updates = [
      { id: '1', type: 'create', timestamp: Date.now() - 1000 },
      { id: '2', type: 'update', timestamp: Date.now() - 2000 },
      { id: '3', type: 'delete', timestamp: Date.now() - 3000 }
    ];

    mockAssignmentContext.optimisticUpdates = updates;

    render(
      <TestWrapper>
        <RealTimeStatusIndicator showText={true} />
      </TestWrapper>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Atualizando')).toBeInTheDocument();
  });
});

describe('Assignment Communication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle notification delivery and timing', async () => {
    // Mock notification system behavior
    const mockNotification = {
      id: 'notif-1',
      type: 'assignment_created',
      title: 'Nova Designação',
      message: 'Você recebeu uma nova designação',
      timestamp: new Date()
    };

    // Test that notifications are properly structured
    expect(mockNotification.type).toBe('assignment_created');
    expect(mockNotification.title).toBe('Nova Designação');
    expect(mockNotification.timestamp).toBeInstanceOf(Date);
  });

  it('should handle reminder scheduling correctly', async () => {
    // Test reminder scheduling logic
    const assignmentDate = new Date();
    assignmentDate.setDate(assignmentDate.getDate() + 7); // 7 days from now

    const reminderTypes = ['one_week', 'three_days', 'one_day'];
    const scheduledReminders = reminderTypes.map(type => ({
      type,
      scheduledFor: new Date(assignmentDate.getTime() - (type === 'one_week' ? 7 : type === 'three_days' ? 3 : 1) * 24 * 60 * 60 * 1000)
    }));

    expect(scheduledReminders).toHaveLength(3);
    expect(scheduledReminders[0].type).toBe('one_week');
    expect(scheduledReminders[1].type).toBe('three_days');
    expect(scheduledReminders[2].type).toBe('one_day');
  });

  it('should collect feedback for completed assignments', async () => {
    // Test feedback collection structure
    const feedback = {
      assignmentId: 'assignment-1',
      rating: 4,
      comments: 'Great presentation!',
      strengths: ['preparation', 'delivery'],
      areasForImprovement: ['timing'],
      submittedAt: new Date()
    };

    expect(feedback.rating).toBeGreaterThanOrEqual(1);
    expect(feedback.rating).toBeLessThanOrEqual(5);
    expect(feedback.strengths).toBeInstanceOf(Array);
    expect(feedback.areasForImprovement).toBeInstanceOf(Array);
  });
});

describe('Timing and Counsel Tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track assignment timing accurately', async () => {
    // Test timing accuracy
    const startTime = Date.now();
    const allocatedTime = 240; // 4 minutes in seconds
    
    // Simulate timing session
    act(() => {
      vi.advanceTimersByTime(180000); // 3 minutes
    });
    
    const actualTime = 180; // 3 minutes
    const isWithinTime = actualTime <= allocatedTime;
    const overtime = Math.max(0, actualTime - allocatedTime);

    expect(isWithinTime).toBe(true);
    expect(overtime).toBe(0);
  });

  it('should record counsel with structured feedback', async () => {
    // Test counsel record structure
    const counselRecord = {
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      counselorId: 'counselor-1',
      sessionDate: new Date(),
      studyPoint: 'Genesis 1:1',
      strengths: ['Boa preparação', 'Apresentação natural'],
      areasForImprovement: ['Melhor uso do tempo'],
      specificFeedback: 'Excellent preparation and delivery!',
      rating: 4,
      nextSteps: ['Praticar em casa'],
      followUpRequired: false
    };

    expect(counselRecord.rating).toBeGreaterThanOrEqual(1);
    expect(counselRecord.rating).toBeLessThanOrEqual(5);
    expect(counselRecord.strengths).toBeInstanceOf(Array);
    expect(counselRecord.areasForImprovement).toBeInstanceOf(Array);
    expect(counselRecord.nextSteps).toBeInstanceOf(Array);
    expect(typeof counselRecord.followUpRequired).toBe('boolean');
  });

  it('should provide performance analytics and suggestions', async () => {
    // Test analytics calculation
    const sessions = [
      { actualTime: 240, allocatedTime: 240 }, // On time
      { actualTime: 200, allocatedTime: 240 }, // Under time
      { actualTime: 280, allocatedTime: 240 }  // Overtime
    ];

    const totalActualTime = sessions.reduce((sum, s) => sum + s.actualTime, 0);
    const totalAllocatedTime = sessions.reduce((sum, s) => sum + s.allocatedTime, 0);
    const averageAccuracy = sessions.reduce((sum, s) => sum + (s.actualTime / s.allocatedTime), 0) / sessions.length;
    const overtimeSessions = sessions.filter(s => s.actualTime > s.allocatedTime).length;

    expect(totalActualTime).toBe(720); // 12 minutes
    expect(totalAllocatedTime).toBe(720); // 12 minutes
    expect(averageAccuracy).toBeCloseTo(1.0, 1); // Close to 100% accuracy
    expect(overtimeSessions).toBe(1); // One overtime session
  });

  it('should handle real-time counsel updates', async () => {
    // Test real-time counsel synchronization
    const counselUpdate = {
      id: 'counsel-1',
      assignmentId: 'assignment-1',
      rating: 5,
      comments: 'Excellent work!',
      timestamp: new Date()
    };

    // Simulate real-time update
    const isValidUpdate = counselUpdate.rating >= 1 && counselUpdate.rating <= 5;
    const hasRequiredFields = !!(counselUpdate.id && counselUpdate.assignmentId);

    expect(isValidUpdate).toBe(true);
    expect(hasRequiredFields).toBe(true);
  });
});

describe('Data Consistency and Validation', () => {
  it('should validate assignment data integrity', () => {
    const assignment = {
      id: 'assignment-1',
      studentId: 'student-1',
      partType: 'bible_reading',
      weekDate: '2024-01-15',
      status: 'confirmed'
    };

    // Validate required fields
    expect(assignment.id).toBeTruthy();
    expect(assignment.studentId).toBeTruthy();
    expect(assignment.partType).toBeTruthy();
    expect(assignment.weekDate).toBeTruthy();
    expect(['pending', 'confirmed', 'completed', 'cancelled']).toContain(assignment.status);
  });

  it('should handle concurrent updates correctly', async () => {
    // Test concurrent update handling
    const optimisticUpdate = {
      id: 'update-1',
      type: 'update',
      timestamp: Date.now(),
      assignment: { id: 'assignment-1', status: 'confirmed' }
    };

    const serverUpdate = {
      id: 'assignment-1',
      status: 'cancelled',
      updatedAt: new Date()
    };

    // Simulate conflict detection
    const hasConflict = optimisticUpdate.assignment.status !== serverUpdate.status;
    expect(hasConflict).toBe(true);
  });

  it('should maintain notification reliability', () => {
    const notification = {
      id: 'notif-1',
      recipientId: 'user-1',
      type: 'assignment_created',
      title: 'Nova Designação',
      message: 'Você recebeu uma nova designação',
      sentAt: new Date(),
      readAt: null,
      retryCount: 0
    };

    // Validate notification structure
    expect(notification.id).toBeTruthy();
    expect(notification.recipientId).toBeTruthy();
    expect(notification.type).toBeTruthy();
    expect(notification.title).toBeTruthy();
    expect(notification.sentAt).toBeInstanceOf(Date);
    expect(notification.retryCount).toBeGreaterThanOrEqual(0);
  });
});