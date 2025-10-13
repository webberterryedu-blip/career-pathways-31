import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAssignmentCommunication } from '../useAssignmentCommunication';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AssignmentCommunicationService } from '@/services/assignmentCommunication';

// Mock the service
vi.mock('@/services/assignmentCommunication', () => ({
  AssignmentCommunicationService: {
    notifyAssignmentCreated: vi.fn(),
    notifyAssignmentUpdated: vi.fn(),
    notifyAssignmentCancelled: vi.fn(),
    requestFeedback: vi.fn(),
    submitFeedback: vi.fn(),
    getUserNotifications: vi.fn()
  }
}));

// Mock Supabase
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  unsubscribe: vi.fn()
};

const mockSupabase = {
  channel: vi.fn(() => mockChannel)
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock auth context
const mockUser = { id: 'test-user', email: 'test@example.com' };
const mockAuthContext = {
  user: mockUser,
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

// Mock notification context
const mockAddNotification = vi.fn();
vi.mock('@/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
  useNotifications: () => ({
    addNotification: mockAddNotification,
    notifications: [],
    unreadCount: 0,
    removeNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
    notifyAssignmentChange: vi.fn(),
    notifyAssignmentReminder: vi.fn(),
    subscribeToNotifications: vi.fn()
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </AuthProvider>
);

describe('useAssignmentCommunication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyAssignmentCreated', () => {
    it('should call service and add local notification for current user', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentCreated);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.notifyAssignmentCreated(
          'assignment-1',
          'test-user', // Current user is the student
          'assistant-1',
          'Bible Reading',
          '2024-01-15'
        );
      });

      expect(mockService).toHaveBeenCalledWith(
        'assignment-1',
        'test-user',
        'assistant-1',
        'Bible Reading',
        '2024-01-15'
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'assignment',
        title: 'Nova Designação',
        message: 'Designação "Bible Reading" para 2024-01-15',
        assignmentId: 'assignment-1',
        duration: 0,
        action: {
          label: 'Ver Detalhes',
          onClick: expect.any(Function)
        }
      });
    });

    it('should add local notification when current user is assistant', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentCreated);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.notifyAssignmentCreated(
          'assignment-1',
          'student-1',
          'test-user', // Current user is the assistant
          'Bible Reading',
          '2024-01-15'
        );
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'assignment',
          title: 'Nova Designação'
        })
      );
    });

    it('should not add local notification for other users', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentCreated);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.notifyAssignmentCreated(
          'assignment-1',
          'other-student',
          'other-assistant',
          'Bible Reading',
          '2024-01-15'
        );
      });

      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentCreated);
      mockService.mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.notifyAssignmentCreated(
          'assignment-1',
          'test-user',
          'assistant-1',
          'Bible Reading',
          '2024-01-15'
        );
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Erro de Comunicação',
        message: 'Não foi possível enviar notificação da designação.',
        duration: 5000
      });
    });
  });

  describe('notifyAssignmentUpdated', () => {
    it('should call service and add local notification with changes', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentUpdated);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      const changes = ['data alterada', 'ajudante modificado'];

      await act(async () => {
        await result.current.notifyAssignmentUpdated(
          'assignment-1',
          'test-user',
          'assistant-1',
          changes,
          'Bible Reading'
        );
      });

      expect(mockService).toHaveBeenCalledWith(
        'assignment-1',
        'test-user',
        'assistant-1',
        changes,
        'Bible Reading'
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'warning',
        title: 'Designação Atualizada',
        message: '"Bible Reading" foi modificada: data alterada, ajudante modificado',
        assignmentId: 'assignment-1',
        duration: 0,
        action: {
          label: 'Ver Alterações',
          onClick: expect.any(Function)
        }
      });
    });
  });

  describe('notifyAssignmentCancelled', () => {
    it('should call service and add local notification with reason', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.notifyAssignmentCancelled);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.notifyAssignmentCancelled(
          'assignment-1',
          'test-user',
          'assistant-1',
          'Bible Reading',
          'Estudante indisponível'
        );
      });

      expect(mockService).toHaveBeenCalledWith(
        'assignment-1',
        'test-user',
        'assistant-1',
        'Bible Reading',
        'Estudante indisponível'
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Designação Cancelada',
        message: '"Bible Reading" foi cancelada: Estudante indisponível',
        assignmentId: 'assignment-1',
        duration: 0
      });
    });
  });

  describe('requestFeedback', () => {
    it('should call service and add local notification for current user', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.requestFeedback);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.requestFeedback(
          'assignment-1',
          'test-user',
          'Bible Reading'
        );
      });

      expect(mockService).toHaveBeenCalledWith(
        'assignment-1',
        'test-user',
        'Bible Reading'
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Avaliação Solicitada',
        message: 'Como foi sua experiência com "Bible Reading"?',
        assignmentId: 'assignment-1',
        duration: 0,
        action: {
          label: 'Avaliar',
          onClick: expect.any(Function)
        }
      });
    });
  });

  describe('submitFeedback', () => {
    it('should call service and add success notification', async () => {
      const mockService = vi.mocked(AssignmentCommunicationService.submitFeedback);
      mockService.mockResolvedValue();

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      const feedback = {
        rating: 4 as const,
        comments: 'Great work!',
        areas_for_improvement: ['timing'],
        strengths: ['preparation']
      };

      await act(async () => {
        await result.current.submitFeedback(
          'assignment-1',
          'student-1',
          feedback
        );
      });

      expect(mockService).toHaveBeenCalledWith(
        'assignment-1',
        'student-1',
        'test-user',
        feedback
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Avaliação Enviada',
        message: 'Obrigado por sua avaliação! Ela nos ajuda a melhorar.',
        duration: 5000
      });
    });

    it('should handle unauthenticated user', async () => {
      // Mock unauthenticated state
      const unauthenticatedContext = {
        ...mockAuthContext,
        user: null
      };

      vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue(unauthenticatedContext);

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      const feedback = {
        rating: 4 as const,
        comments: 'Great work!'
      };

      await act(async () => {
        await result.current.submitFeedback(
          'assignment-1',
          'student-1',
          feedback
        );
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Erro ao Enviar Avaliação',
        message: 'Não foi possível enviar sua avaliação. Tente novamente.',
        duration: 5000
      });

      // Restore mock
      vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue(mockAuthContext);
    });
  });

  describe('loadUserNotifications', () => {
    it('should load and convert database notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          assignmentId: 'assignment-1',
          type: 'assignment_created',
          title: 'Nova Designação',
          message: 'Você recebeu uma nova designação',
          readAt: null,
          metadata: { requires_action: true }
        }
      ];

      const mockService = vi.mocked(AssignmentCommunicationService.getUserNotifications);
      mockService.mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.loadUserNotifications();
      });

      expect(mockService).toHaveBeenCalledWith('test-user');
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'assignment',
        title: 'Nova Designação',
        message: 'Você recebeu uma nova designação',
        assignmentId: 'assignment-1',
        duration: 0,
        action: {
          label: 'Ver Detalhes',
          onClick: expect.any(Function)
        }
      });
    });

    it('should not add already read notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          assignmentId: 'assignment-1',
          type: 'assignment_created',
          title: 'Nova Designação',
          message: 'Você recebeu uma nova designação',
          readAt: '2024-01-15T10:00:00Z' // Already read
        }
      ];

      const mockService = vi.mocked(AssignmentCommunicationService.getUserNotifications);
      mockService.mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.loadUserNotifications();
      });

      expect(mockAddNotification).not.toHaveBeenCalled();
    });
  });

  describe('real-time subscription', () => {
    it('should set up real-time subscription on mount', () => {
      renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      expect(mockSupabase.channel).toHaveBeenCalledWith('user_notifications');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_notifications',
          filter: 'recipient_id=eq.test-user'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle real-time notification updates', async () => {
      let subscriptionCallback: Function;

      mockChannel.on.mockImplementation((event, config, callback) => {
        if (event === 'postgres_changes') {
          subscriptionCallback = callback;
        }
        return mockChannel;
      });

      renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      // Simulate real-time notification
      const mockPayload = {
        new: {
          assignment_id: 'assignment-1',
          type: 'assignment_created',
          title: 'Nova Designação',
          message: 'Você recebeu uma nova designação',
          metadata: { requires_action: true }
        }
      };

      act(() => {
        if (subscriptionCallback) {
          subscriptionCallback(mockPayload);
        }
      });

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'assignment',
          title: 'Nova Designação',
          message: 'Você recebeu uma nova designação',
          assignmentId: 'assignment-1',
          duration: 0,
          action: {
            label: 'Ver Detalhes',
            onClick: expect.any(Function)
          }
        });
      });
    });

    it('should clean up subscription on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockChannel.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      const { unmount } = renderHook(() => useAssignmentCommunication(), {
        wrapper: TestWrapper
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});