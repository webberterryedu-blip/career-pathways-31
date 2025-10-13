import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssignmentCommunicationService } from '../assignmentCommunication';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({ data: [], error: null }))
          })),
          lte: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}));

describe('AssignmentCommunicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('notifyAssignmentCreated', () => {
    it('should create notifications for student and assistant', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      await AssignmentCommunicationService.notifyAssignmentCreated(
        'assignment-1',
        'student-1',
        'assistant-1',
        'Bible Reading',
        '2024-01-15'
      );

      expect(supabase.from).toHaveBeenCalledWith('assignment_notifications');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          assignmentId: 'assignment-1',
          recipientId: 'student-1',
          type: 'assignment_created',
          title: 'Nova Designação Recebida',
          message: 'Você recebeu uma nova designação: "Bible Reading" para a semana de 2024-01-15.',
          metadata: {
            partTitle: 'Bible Reading',
            weekDate: '2024-01-15',
            role: 'student'
          }
        }),
        expect.objectContaining({
          assignmentId: 'assignment-1',
          recipientId: 'assistant-1',
          type: 'assignment_created',
          title: 'Nova Designação como Ajudante',
          message: 'Você foi designado como ajudante na apresentação "Bible Reading" para a semana de 2024-01-15.',
          metadata: {
            partTitle: 'Bible Reading',
            weekDate: '2024-01-15',
            role: 'assistant'
          }
        })
      ]);
    });

    it('should create notification only for student when no assistant', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      await AssignmentCommunicationService.notifyAssignmentCreated(
        'assignment-1',
        'student-1',
        null,
        'Bible Reading',
        '2024-01-15'
      );

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          recipientId: 'student-1',
          type: 'assignment_created'
        })
      ]);
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Database connection failed' } 
      });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      await expect(
        AssignmentCommunicationService.notifyAssignmentCreated(
          'assignment-1',
          'student-1',
          'assistant-1',
          'Bible Reading',
          '2024-01-15'
        )
      ).rejects.toThrow();
    });
  });

  describe('scheduleReminders', () => {
    it('should schedule multiple reminders for future assignments', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      // Set current time
      const now = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(now);

      // Assignment is 10 days in the future
      const assignmentDate = new Date('2024-01-11T19:00:00Z');

      await AssignmentCommunicationService.scheduleReminders(
        'assignment-1',
        'student-1',
        'assistant-1',
        assignmentDate.toISOString()
      );

      expect(supabase.from).toHaveBeenCalledWith('assignment_reminders');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          assignmentId: 'assignment-1',
          studentId: 'student-1',
          assistantId: 'assistant-1',
          reminderType: 'one_week',
          scheduledFor: new Date('2024-01-04T19:00:00Z'),
          sent: false
        }),
        expect.objectContaining({
          reminderType: 'three_days',
          scheduledFor: new Date('2024-01-08T19:00:00Z')
        }),
        expect.objectContaining({
          reminderType: 'one_day',
          scheduledFor: new Date('2024-01-10T19:00:00Z')
        })
      ]);
    });

    it('should not schedule past reminders', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      // Set current time
      const now = new Date('2024-01-10T10:00:00Z');
      vi.setSystemTime(now);

      // Assignment is tomorrow (only one-day reminder should be scheduled)
      const assignmentDate = new Date('2024-01-11T19:00:00Z');

      await AssignmentCommunicationService.scheduleReminders(
        'assignment-1',
        'student-1',
        null,
        assignmentDate.toISOString()
      );

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          reminderType: 'one_day',
          scheduledFor: new Date('2024-01-10T19:00:00Z')
        })
      ]);
    });
  });

  describe('submitFeedback', () => {
    it('should store feedback and send confirmation', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      const feedback = {
        rating: 5 as const,
        comments: 'Excellent presentation!',
        areas_for_improvement: ['timing', 'eye contact'],
        strengths: ['preparation', 'delivery']
      };

      await AssignmentCommunicationService.submitFeedback(
        'assignment-1',
        'student-1',
        'counselor-1',
        feedback
      );

      // Should insert feedback record
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: 'assignment-1',
          studentId: 'student-1',
          submittedBy: 'counselor-1',
          rating: 5,
          comments: 'Excellent presentation!',
          areas_for_improvement: ['timing', 'eye contact'],
          strengths: ['preparation', 'delivery'],
          submittedAt: expect.any(Date)
        })
      );

      // Should send confirmation notification
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment_id: 'assignment-1',
          recipient_id: 'student-1',
          type: 'assignment_updated',
          title: 'Avaliação Recebida',
          message: 'Obrigado por sua avaliação! Ela nos ajuda a melhorar o sistema de designações.',
          metadata: {
            feedback_submitted: true,
            rating: 5
          }
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should fetch user notifications with pagination', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockNotifications = [
        {
          id: 'notif-1',
          recipient_id: 'user-1',
          type: 'assignment_created',
          title: 'Nova Designação',
          message: 'Você recebeu uma nova designação',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      const mockRange = vi.fn().mockResolvedValue({ 
        data: mockNotifications, 
        error: null 
      });

      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => ({
              range: mockRange
            })
          })
        })
      });

      const result = await AssignmentCommunicationService.getUserNotifications(
        'user-1',
        10,
        0
      );

      expect(supabase.from).toHaveBeenCalledWith('assignment_notifications');
      expect(mockRange).toHaveBeenCalledWith(0, 9); // 0-based range
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('processPendingReminders', () => {
    it('should handle empty pending reminders gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockSelect = vi.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      });

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue(mockSelect)
          })
        })
      });

      await AssignmentCommunicationService.processPendingReminders();

      expect(mockSelect).toHaveBeenCalled();
      // Should not attempt to process any reminders
    });
  });

  describe('validation and error handling', () => {
    it('should validate notification structure', () => {
      const notification = {
        assignmentId: 'assignment-1',
        recipientId: 'user-1',
        type: 'assignment_created',
        title: 'Nova Designação',
        message: 'Test message',
        metadata: { role: 'student' }
      };

      expect(notification.assignmentId).toBeTruthy();
      expect(notification.recipientId).toBeTruthy();
      expect(notification.type).toBeTruthy();
      expect(notification.title).toBeTruthy();
      expect(['assignment_created', 'assignment_updated', 'assignment_cancelled', 'reminder', 'feedback_request']).toContain(notification.type);
    });

    it('should validate reminder structure', () => {
      const reminder = {
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        reminderType: 'one_week',
        scheduledFor: new Date(),
        sent: false
      };

      expect(reminder.assignmentId).toBeTruthy();
      expect(reminder.studentId).toBeTruthy();
      expect(['initial', 'one_week', 'three_days', 'one_day']).toContain(reminder.reminderType);
      expect(reminder.scheduledFor).toBeInstanceOf(Date);
      expect(typeof reminder.sent).toBe('boolean');
    });

    it('should validate feedback structure', () => {
      const feedback = {
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        submittedBy: 'counselor-1',
        rating: 4,
        comments: 'Good work',
        submittedAt: new Date()
      };

      expect(feedback.assignmentId).toBeTruthy();
      expect(feedback.studentId).toBeTruthy();
      expect(feedback.submittedBy).toBeTruthy();
      expect(feedback.rating).toBeGreaterThanOrEqual(1);
      expect(feedback.rating).toBeLessThanOrEqual(5);
      expect(feedback.submittedAt).toBeInstanceOf(Date);
    });
  });
});