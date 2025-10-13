import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CounselTracker from '../CounselTracker';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Mock the notification context
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

interface CounselSession {
  assignmentId: string;
  studentName: string;
  partTitle: string;
  studyPoint: string;
  actualTime?: number;
  allocatedTime: number;
  status: 'pending' | 'in_progress' | 'completed';
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>
    {children}
  </NotificationProvider>
);

describe('CounselTracker', () => {
  const mockSessions: CounselSession[] = [
    {
      assignmentId: 'assignment-1',
      studentName: 'John Doe',
      partTitle: 'Bible Reading',
      studyPoint: 'Genesis 1:1',
      actualTime: 240,
      allocatedTime: 240,
      status: 'completed'
    },
    {
      assignmentId: 'assignment-2',
      studentName: 'Jane Smith',
      partTitle: 'Starting a Conversation',
      studyPoint: 'How to start meaningful conversations',
      actualTime: 200,
      allocatedTime: 180,
      status: 'completed'
    }
  ];

  const mockOnCounselComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders session selection when no active session', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Selecione uma apresentação para dar conselho:')).toBeInTheDocument();
    expect(screen.getByText('Bible Reading')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Starting a Conversation')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows only completed sessions for counsel', () => {
    const sessionsWithPending = [
      ...mockSessions,
      {
        assignmentId: 'assignment-3',
        studentName: 'Bob Wilson',
        partTitle: 'Following Up',
        studyPoint: 'Effective follow-up techniques',
        allocatedTime: 180,
        status: 'pending' as const
      }
    ];

    render(
      <TestWrapper>
        <CounselTracker
          sessions={sessionsWithPending}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Bible Reading')).toBeInTheDocument();
    expect(screen.getByText('Starting a Conversation')).toBeInTheDocument();
    expect(screen.queryByText('Following Up')).not.toBeInTheDocument();
  });

  it('displays timing information correctly', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Tempo: 4:00')).toBeInTheDocument();
    expect(screen.getByText('Tempo: 3:20')).toBeInTheDocument();
    expect(screen.getByText('(+0:20)')).toBeInTheDocument(); // Overtime indicator
  });

  it('starts counsel session correctly', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Should show counsel form
    expect(screen.getByText('Bible Reading')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Ponto de estudo: Genesis 1:1')).toBeInTheDocument();
    expect(screen.getByText('Avaliação Geral')).toBeInTheDocument();
  });

  it('handles rating selection', async () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Open rating dropdown
    const ratingSelect = screen.getByRole('combobox');
    fireEvent.click(ratingSelect);

    // Select "Excelente" (5 stars)
    fireEvent.click(screen.getByText('Excelente'));

    // Rating should be selected
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('handles strength selection', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Select some strengths
    const preparationCheckbox = screen.getByLabelText('Boa preparação');
    const deliveryCheckbox = screen.getByLabelText('Apresentação natural');

    fireEvent.click(preparationCheckbox);
    fireEvent.click(deliveryCheckbox);

    expect(preparationCheckbox).toBeChecked();
    expect(deliveryCheckbox).toBeChecked();
  });

  it('handles improvement area selection', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Select some improvement areas
    const timingCheckbox = screen.getByLabelText('Melhor uso do tempo');
    const eyeContactCheckbox = screen.getByLabelText('Melhorar contato visual');

    fireEvent.click(timingCheckbox);
    fireEvent.click(eyeContactCheckbox);

    expect(timingCheckbox).toBeChecked();
    expect(eyeContactCheckbox).toBeChecked();
  });

  it('handles specific feedback input', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Navigate to feedback tab
    fireEvent.click(screen.getByText('Feedback'));

    // Enter specific feedback
    const feedbackTextarea = screen.getByPlaceholderText(/Ex: A aplicação prática/);
    fireEvent.change(feedbackTextarea, {
      target: { value: 'Excellent preparation and clear delivery. Keep up the good work!' }
    });

    expect(feedbackTextarea).toHaveValue('Excellent preparation and clear delivery. Keep up the good work!');
  });

  it('handles next steps selection', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Navigate to next steps tab
    fireEvent.click(screen.getByText('Próximos Passos'));

    // Select some next steps
    const practiceCheckbox = screen.getByLabelText('Praticar em casa');
    const studyCheckbox = screen.getByLabelText('Estudar material adicional');

    fireEvent.click(practiceCheckbox);
    fireEvent.click(studyCheckbox);

    expect(practiceCheckbox).toBeChecked();
    expect(studyCheckbox).toBeChecked();
  });

  it('saves counsel record correctly', async () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Fill out form
    const ratingSelect = screen.getByRole('combobox');
    fireEvent.click(ratingSelect);
    fireEvent.click(screen.getByText('Bom'));

    const preparationCheckbox = screen.getByLabelText('Boa preparação');
    fireEvent.click(preparationCheckbox);

    const timingCheckbox = screen.getByLabelText('Melhor uso do tempo');
    fireEvent.click(timingCheckbox);

    // Navigate to feedback tab and add specific feedback
    fireEvent.click(screen.getByText('Feedback'));
    const feedbackTextarea = screen.getByPlaceholderText(/Ex: A aplicação prática/);
    fireEvent.change(feedbackTextarea, {
      target: { value: 'Great job overall!' }
    });

    // Navigate to next steps and select some
    fireEvent.click(screen.getByText('Próximos Passos'));
    const practiceCheckbox = screen.getByLabelText('Praticar em casa');
    fireEvent.click(practiceCheckbox);

    // Save counsel
    fireEvent.click(screen.getByText('Salvar Conselho'));

    await waitFor(() => {
      expect(mockOnCounselComplete).toHaveBeenCalledWith(
        'assignment-1',
        expect.objectContaining({
          assignmentId: 'assignment-1',
          rating: 4,
          strengths: ['Boa preparação'],
          areasForImprovement: ['Melhor uso do tempo'],
          specificFeedback: 'Great job overall!',
          nextSteps: ['Praticar em casa'],
          followUpRequired: false
        })
      );
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Conselho Registrado',
      message: 'Conselho para John Doe foi salvo com sucesso.',
      duration: 3000
    });
  });

  it('handles follow-up requirement', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Navigate to feedback tab
    fireEvent.click(screen.getByText('Feedback'));

    // Check follow-up required
    const followUpCheckbox = screen.getByLabelText('Requer acompanhamento adicional');
    fireEvent.click(followUpCheckbox);

    expect(followUpCheckbox).toBeChecked();
  });

  it('prevents saving without rating', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Try to save without rating
    const saveButton = screen.getByText('Salvar Conselho');
    expect(saveButton).toBeDisabled();
  });

  it('cancels counsel session correctly', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Cancel
    fireEvent.click(screen.getByText('Cancelar'));

    // Should return to session selection
    expect(screen.getByText('Selecione uma apresentação para dar conselho:')).toBeInTheDocument();
  });

  it('handles save errors gracefully', async () => {
    mockOnCounselComplete.mockRejectedValue(new Error('Save failed'));

    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session and fill minimum required fields
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    const ratingSelect = screen.getByRole('combobox');
    fireEvent.click(ratingSelect);
    fireEvent.click(screen.getByText('Bom'));

    // Try to save
    fireEvent.click(screen.getByText('Salvar Conselho'));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar o conselho. Tente novamente.',
        duration: 5000
      });
    });
  });

  it('shows empty state when no completed sessions', () => {
    const emptySessions: CounselSession[] = [
      {
        assignmentId: 'assignment-1',
        studentName: 'John Doe',
        partTitle: 'Bible Reading',
        studyPoint: 'Genesis 1:1',
        allocatedTime: 240,
        status: 'pending'
      }
    ];

    render(
      <TestWrapper>
        <CounselTracker
          sessions={emptySessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Nenhuma apresentação concluída para dar conselho')).toBeInTheDocument();
  });

  it('displays tabs correctly', () => {
    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    // Check all tabs are present
    expect(screen.getByText('Avaliação')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Próximos Passos')).toBeInTheDocument();

    // Navigate between tabs
    fireEvent.click(screen.getByText('Feedback'));
    expect(screen.getByText('Feedback Específico')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Próximos Passos'));
    expect(screen.getByText('Próximos Passos')).toBeInTheDocument();
  });

  it('shows loading state while saving', async () => {
    // Mock a slow save operation
    mockOnCounselComplete.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <TestWrapper>
        <CounselTracker
          sessions={mockSessions}
          onCounselComplete={mockOnCounselComplete}
        />
      </TestWrapper>
    );

    // Start counsel session and fill minimum required fields
    const counselButtons = screen.getAllByText('Dar Conselho');
    fireEvent.click(counselButtons[0]);

    const ratingSelect = screen.getByRole('combobox');
    fireEvent.click(ratingSelect);
    fireEvent.click(screen.getByText('Bom'));

    // Start saving
    fireEvent.click(screen.getByText('Salvar Conselho'));

    // Should show loading state
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});