// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentNotification {
  id: string;
  assignmentId: string;
  recipientId: string;
  type: 'assignment_created' | 'assignment_updated' | 'assignment_cancelled' | 'reminder' | 'feedback_request';
  title: string;
  message: string;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export interface AssignmentReminder {
  id: string;
  assignmentId: string;
  studentId: string;
  assistantId?: string;
  reminderType: 'initial' | 'one_week' | 'three_days' | 'one_day';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

export interface AssignmentFeedback {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedBy: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  areas_for_improvement?: string[];
  strengths?: string[];
  submittedAt: Date;
}

/**
 * AssignmentCommunicationService - Handles all communication related to assignments
 * Including notifications, reminders, and feedback collection
 */
export class AssignmentCommunicationService {
  
  /**
   * Send notification to student and assistant about new assignment
   */
  static async notifyAssignmentCreated(
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    partTitle: string,
    weekDate: string
  ): Promise<void> {
    try {
      const notifications: Omit<AssignmentNotification, 'id'>[] = [
        {
          assignmentId,
          recipientId: studentId,
          type: 'assignment_created',
          title: 'Nova Designação Recebida',
          message: `Você recebeu uma nova designação: "${partTitle}" para a semana de ${weekDate}.`,
          metadata: {
            partTitle,
            weekDate,
            role: 'student'
          }
        }
      ];

      // Add notification for assistant if present
      if (assistantId) {
        notifications.push({
          assignmentId,
          recipientId: assistantId,
          type: 'assignment_created',
          title: 'Nova Designação como Ajudante',
          message: `Você foi designado como ajudante na apresentação "${partTitle}" para a semana de ${weekDate}.`,
          metadata: {
            partTitle,
            weekDate,
            role: 'assistant'
          }
        });
      }

      // Store notifications in database
      const { error } = await supabase
        .from('assignment_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating assignment notifications:', error);
        throw error;
      }

      // Schedule reminders
      await this.scheduleReminders(assignmentId, studentId, assistantId, weekDate);

    } catch (error) {
      console.error('Error notifying assignment creation:', error);
      throw error;
    }
  }

  /**
   * Send notification about assignment updates
   */
  static async notifyAssignmentUpdated(
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    changes: string[],
    partTitle: string
  ): Promise<void> {
    try {
      const changesList = changes.join(', ');
      const notifications: Omit<AssignmentNotification, 'id'>[] = [
        {
          assignmentId,
          recipientId: studentId,
          type: 'assignment_updated',
          title: 'Designação Atualizada',
          message: `Sua designação "${partTitle}" foi atualizada. Alterações: ${changesList}.`,
          metadata: {
            partTitle,
            changes,
            role: 'student'
          }
        }
      ];

      if (assistantId) {
        notifications.push({
          assignmentId,
          recipientId: assistantId,
          type: 'assignment_updated',
          title: 'Designação Atualizada',
          message: `A designação "${partTitle}" onde você é ajudante foi atualizada. Alterações: ${changesList}.`,
          metadata: {
            partTitle,
            changes,
            role: 'assistant'
          }
        });
      }

      const { error } = await supabase
        .from('assignment_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating update notifications:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error notifying assignment update:', error);
      throw error;
    }
  }

  /**
   * Send notification about assignment cancellation
   */
  static async notifyAssignmentCancelled(
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    partTitle: string,
    reason?: string
  ): Promise<void> {
    try {
      const reasonText = reason ? ` Motivo: ${reason}` : '';
      const notifications: Omit<AssignmentNotification, 'id'>[] = [
        {
          assignmentId,
          recipientId: studentId,
          type: 'assignment_cancelled',
          title: 'Designação Cancelada',
          message: `Sua designação "${partTitle}" foi cancelada.${reasonText}`,
          metadata: {
            partTitle,
            reason,
            role: 'student'
          }
        }
      ];

      if (assistantId) {
        notifications.push({
          assignmentId,
          recipientId: assistantId,
          type: 'assignment_cancelled',
          title: 'Designação Cancelada',
          message: `A designação "${partTitle}" onde você era ajudante foi cancelada.${reasonText}`,
          metadata: {
            partTitle,
            reason,
            role: 'assistant'
          }
        });
      }

      const { error } = await supabase
        .from('assignment_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating cancellation notifications:', error);
        throw error;
      }

      // Cancel any pending reminders
      await this.cancelReminders(assignmentId);

    } catch (error) {
      console.error('Error notifying assignment cancellation:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic reminders for an assignment
   */
  static async scheduleReminders(
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    weekDate: string
  ): Promise<void> {
    try {
      const assignmentDate = new Date(weekDate);
      const now = new Date();

      const reminders: Omit<AssignmentReminder, 'id'>[] = [];

      // One week reminder
      const oneWeekBefore = new Date(assignmentDate);
      oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
      if (oneWeekBefore > now) {
        reminders.push({
          assignmentId,
          studentId,
          assistantId,
          reminderType: 'one_week',
          scheduledFor: oneWeekBefore,
          sent: false
        });
      }

      // Three days reminder
      const threeDaysBefore = new Date(assignmentDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
      if (threeDaysBefore > now) {
        reminders.push({
          assignmentId,
          studentId,
          assistantId,
          reminderType: 'three_days',
          scheduledFor: threeDaysBefore,
          sent: false
        });
      }

      // One day reminder
      const oneDayBefore = new Date(assignmentDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      if (oneDayBefore > now) {
        reminders.push({
          assignmentId,
          studentId,
          assistantId,
          reminderType: 'one_day',
          scheduledFor: oneDayBefore,
          sent: false
        });
      }

      if (reminders.length > 0) {
        const { error } = await supabase
          .from('assignment_reminders')
          .insert(reminders);

        if (error) {
          console.error('Error scheduling reminders:', error);
          throw error;
        }
      }

    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Cancel all pending reminders for an assignment
   */
  static async cancelReminders(assignmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assignment_reminders')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('sent', false);

      if (error) {
        console.error('Error cancelling reminders:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error cancelling reminders:', error);
      throw error;
    }
  }

  /**
   * Process pending reminders (to be called by a scheduled job)
   */
  static async processPendingReminders(): Promise<void> {
    try {
      const now = new Date();

      // Get all pending reminders that should be sent
      const { data: pendingReminders, error: fetchError } = await supabase
        .from('assignment_reminders')
        .select(`
          *,
          assignments:designacoes(
            id,
            titulo_parte,
            data_designacao,
            estudante_id,
            ajudante_id
          )
        `)
        .eq('sent', false)
        .lte('scheduled_for', now.toISOString());

      if (fetchError) {
        console.error('Error fetching pending reminders:', fetchError);
        throw fetchError;
      }

      if (!pendingReminders || pendingReminders.length === 0) {
        return;
      }

      // Process each reminder
      for (const reminder of pendingReminders) {
        try {
          await this.sendReminder(reminder);
          
          // Mark as sent
          await supabase
            .from('assignment_reminders')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', reminder.id);

        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error processing pending reminders:', error);
      throw error;
    }
  }

  /**
   * Send a specific reminder
   */
  private static async sendReminder(reminder: any): Promise<void> {
    const assignment = reminder.assignments;
    if (!assignment) return;

    const reminderMessages = {
      one_week: 'Lembrete: Sua designação é na próxima semana.',
      three_days: 'Lembrete: Sua designação é em 3 dias.',
      one_day: 'Lembrete: Sua designação é amanhã.'
    };

    const message = reminderMessages[reminder.reminder_type as keyof typeof reminderMessages];

    // Send to student
    await supabase
      .from('assignment_notifications')
      .insert({
        assignment_id: reminder.assignment_id,
        recipient_id: reminder.student_id,
        type: 'reminder',
        title: 'Lembrete de Designação',
        message: `${message} Parte: "${assignment.titulo_parte}" - ${assignment.data_designacao}`,
        metadata: {
          reminder_type: reminder.reminder_type,
          part_title: assignment.titulo_parte,
          week_date: assignment.data_designacao
        }
      });

    // Send to assistant if present
    if (reminder.assistant_id) {
      await supabase
        .from('assignment_notifications')
        .insert({
          assignment_id: reminder.assignment_id,
          recipient_id: reminder.assistant_id,
          type: 'reminder',
          title: 'Lembrete de Designação (Ajudante)',
          message: `${message} Você é ajudante na parte: "${assignment.titulo_parte}" - ${assignment.data_designacao}`,
          metadata: {
            reminder_type: reminder.reminder_type,
            part_title: assignment.titulo_parte,
            week_date: assignment.data_designacao,
            role: 'assistant'
          }
        });
    }
  }

  /**
   * Request feedback for a completed assignment
   */
  static async requestFeedback(
    assignmentId: string,
    studentId: string,
    partTitle: string
  ): Promise<void> {
    try {
      const notification: Omit<AssignmentNotification, 'id'> = {
        assignmentId,
        recipientId: studentId,
        type: 'feedback_request',
        title: 'Avaliação da Designação',
        message: `Como foi sua experiência com a designação "${partTitle}"? Sua avaliação nos ajuda a melhorar.`,
        metadata: {
          partTitle,
          requires_action: true
        }
      };

      const { error } = await supabase
        .from('assignment_notifications')
        .insert(notification);

      if (error) {
        console.error('Error requesting feedback:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error requesting feedback:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for an assignment
   */
  static async submitFeedback(
    assignmentId: string,
    studentId: string,
    submittedBy: string,
    feedback: {
      rating: 1 | 2 | 3 | 4 | 5;
      comments?: string;
      areas_for_improvement?: string[];
      strengths?: string[];
    }
  ): Promise<void> {
    try {
      const feedbackRecord: Omit<AssignmentFeedback, 'id'> = {
        assignmentId,
        studentId,
        submittedBy,
        rating: feedback.rating,
        comments: feedback.comments,
        areas_for_improvement: feedback.areas_for_improvement,
        strengths: feedback.strengths,
        submittedAt: new Date()
      };

      const { error } = await supabase
        .from('assignment_feedback')
        .insert(feedbackRecord);

      if (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }

      // Send confirmation notification
      await supabase
        .from('assignment_notifications')
        .insert({
          assignment_id: assignmentId,
          recipient_id: studentId,
          type: 'assignment_updated',
          title: 'Avaliação Recebida',
          message: 'Obrigado por sua avaliação! Ela nos ajuda a melhorar o sistema de designações.',
          metadata: {
            feedback_submitted: true,
            rating: feedback.rating
          }
        });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AssignmentNotification[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assignment_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get assignment feedback
   */
  static async getAssignmentFeedback(assignmentId: string): Promise<AssignmentFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_feedback')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignment feedback:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting assignment feedback:', error);
      throw error;
    }
  }
}