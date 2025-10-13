import { useState, useEffect } from 'react';
import { Bell, Clock, Send, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

interface AssignmentReminder {
  id: string;
  assignmentId: string;
  studentId: string;
  assistantId?: string;
  reminderType: 'initial' | 'one_week' | 'three_days' | 'one_day';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  assignment?: {
    titulo_parte: string;
    data_designacao: string;
    estudante: { nome: string };
    ajudante?: { nome: string };
  };
}

interface ReminderManagementProps {
  assignmentId?: string;
  className?: string;
}

/**
 * ReminderManagement - Manages assignment reminders
 * Shows scheduled reminders and allows manual sending
 */
export default function ReminderManagement({ 
  assignmentId, 
  className 
}: ReminderManagementProps) {
  const [reminders, setReminders] = useState<AssignmentReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const { addNotification } = useNotifications();

  // Load reminders (mock implementation for demonstration)
  const loadReminders = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockReminders: AssignmentReminder[] = [
        {
          id: '1',
          assignmentId: assignmentId || 'demo-1',
          studentId: 'student-1',
          assistantId: 'assistant-1',
          reminderType: 'one_week',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          sent: false,
          assignment: {
            titulo_parte: 'Iniciando Conversas',
            data_designacao: '2024-02-15',
            estudante: { nome: 'João Silva' },
            ajudante: { nome: 'Maria Santos' }
          }
        },
        {
          id: '2',
          assignmentId: assignmentId || 'demo-2',
          studentId: 'student-2',
          reminderType: 'three_days',
          scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          sent: false,
          assignment: {
            titulo_parte: 'Explicando suas Crenças',
            data_designacao: '2024-02-22',
            estudante: { nome: 'Pedro Costa' }
          }
        }
      ];

      // Filter by assignmentId if provided
      const filteredReminders = assignmentId 
        ? mockReminders.filter(r => r.assignmentId === assignmentId)
        : mockReminders;

      setReminders(filteredReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Carregar Lembretes',
        message: 'Não foi possível carregar os lembretes agendados.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Send reminder manually (mock implementation for demonstration)
  const sendReminderNow = async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      // Mock sending - update local state
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, sent: true, sentAt: new Date() }
          : r
      ));

      // Send notification through the notification system
      addNotification({
        type: 'reminder',
        title: 'Lembrete de Designação',
        message: `Lembrete: Sua designação "${reminder.assignment?.titulo_parte}" é em ${reminder.assignment?.data_designacao}`,
        duration: 0,
        action: {
          label: 'Ver Designação',
          onClick: () => {
            window.location.href = `/designacoes?assignment=${reminder.assignmentId}`;
          }
        }
      });

      addNotification({
        type: 'success',
        title: 'Lembrete Enviado',
        message: 'O lembrete foi enviado com sucesso.',
        duration: 3000
      });

    } catch (error) {
      console.error('Error sending reminder:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Enviar Lembrete',
        message: 'Não foi possível enviar o lembrete.',
        duration: 5000
      });
    }
  };

  // Delete reminder (mock implementation for demonstration)
  const deleteReminder = async (reminderId: string) => {
    try {
      // Mock deletion - update local state
      setReminders(prev => prev.filter(r => r.id !== reminderId));

      addNotification({
        type: 'success',
        title: 'Lembrete Removido',
        message: 'O lembrete foi removido com sucesso.',
        duration: 3000
      });

    } catch (error) {
      console.error('Error deleting reminder:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Remover Lembrete',
        message: 'Não foi possível remover o lembrete.',
        duration: 5000
      });
    }
  };

  // Load reminders on mount
  useEffect(() => {
    loadReminders();
  }, [assignmentId]);

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Inicial';
      case 'one_week': return '1 Semana';
      case 'three_days': return '3 Dias';
      case 'one_day': return '1 Dia';
      default: return type;
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'initial': return 'bg-blue-100 text-blue-800';
      case 'one_week': return 'bg-green-100 text-green-800';
      case 'three_days': return 'bg-yellow-100 text-yellow-800';
      case 'one_day': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const isOverdue = (scheduledFor: Date, sent: boolean) => {
    return !sent && new Date(scheduledFor) < new Date();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Lembretes de Designação
            </CardTitle>
            <CardDescription>
              Gerencie lembretes automáticos e manuais para as designações
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-reminders"
              checked={autoRemindersEnabled}
              onCheckedChange={setAutoRemindersEnabled}
            />
            <Label htmlFor="auto-reminders" className="text-sm">
              Lembretes Automáticos
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lembrete agendado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  reminder.sent 
                    ? 'bg-gray-50 border-gray-200' 
                    : isOverdue(reminder.scheduledFor, reminder.sent)
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getReminderTypeColor(reminder.reminderType)}>
                      {getReminderTypeLabel(reminder.reminderType)}
                    </Badge>
                    
                    {reminder.sent && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enviado
                      </Badge>
                    )}
                    
                    {isOverdue(reminder.scheduledFor, reminder.sent) && (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Atrasado
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {reminder.assignment?.titulo_parte || 'Designação'}
                    </p>
                    <p className="text-gray-600">
                      Para: {reminder.assignment?.estudante?.nome}
                      {reminder.assignment?.ajudante && 
                        ` e ${reminder.assignment.ajudante.nome} (ajudante)`
                      }
                    </p>
                    <p className="text-gray-500">
                      Agendado para: {formatDate(reminder.scheduledFor)}
                      {reminder.sentAt && (
                        <span className="ml-2">
                          • Enviado em: {formatDate(new Date(reminder.sentAt))}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!reminder.sent && (
                    <Button
                      size="sm"
                      onClick={() => sendReminderNow(reminder.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enviar Agora
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}