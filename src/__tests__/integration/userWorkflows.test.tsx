/**
 * Integration tests for complete user workflows
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProgramProvider } from '@/contexts/ProgramContext';
import { AssignmentProvider } from '@/contexts/AssignmentContext';
import { StudentProvider } from '@/contexts/StudentContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import App from '@/App';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      unsubscribe: vi.fn(),
    })),
  })),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ProgramProvider>
                <AssignmentProvider>
                  <StudentProvider>
                    {children}
                  </StudentProvider>
                </AssignmentProvider>
              </ProgramProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('User Workflows Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('Instructor Workflow', () => {
    it('should complete full assignment creation workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // 1. Navigate to students page
      await waitFor(() => {
        expect(screen.getByText(/estudantes/i)).toBeInTheDocument();
      });

      // 2. Add a new student
      const addStudentButton = screen.getByRole('button', { name: /adicionar estudante/i });
      await user.click(addStudentButton);

      // Fill student form
      const nameInput = screen.getByLabelText(/nome/i);
      await user.type(nameInput, 'João Silva');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'joao@example.com');

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // 3. Navigate to programs page
      const programsLink = screen.getByText(/programas/i);
      await user.click(programsLink);

      // 4. Upload a program
      const uploadButton = screen.getByRole('button', { name: /upload programa/i });
      await user.click(uploadButton);

      // Mock file upload
      const fileInput = screen.getByLabelText(/arquivo/i);
      const file = new File(['program content'], 'program.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      // 5. Navigate to assignments page
      const assignmentsLink = screen.getByText(/designações/i);
      await user.click(assignmentsLink);

      // 6. Generate assignments
      const generateButton = screen.getByRole('button', { name: /gerar designações/i });
      await user.click(generateButton);

      // Verify assignment generation modal opens
      await waitFor(() => {
        expect(screen.getByText(/gerar designações automaticamente/i)).toBeInTheDocument();
      });

      // Configure assignment generation
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      // 7. Verify assignments were created
      await waitFor(() => {
        expect(screen.getByText(/designações geradas com sucesso/i)).toBeInTheDocument();
      });
    });

    it('should handle assignment conflict resolution', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to assignments page
      const assignmentsLink = screen.getByText(/designações/i);
      await user.click(assignmentsLink);

      // Create conflicting assignment
      const addAssignmentButton = screen.getByRole('button', { name: /nova designação/i });
      await user.click(addAssignmentButton);

      // Fill assignment form with conflicting data
      const studentSelect = screen.getByLabelText(/estudante/i);
      await user.selectOptions(studentSelect, 'João Silva');

      const partSelect = screen.getByLabelText(/parte/i);
      await user.selectOptions(partSelect, 'Leitura da Bíblia');

      // Try to save conflicting assignment
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify conflict detection
      await waitFor(() => {
        expect(screen.getByText(/conflito detectado/i)).toBeInTheDocument();
      });

      // Resolve conflict
      const resolveButton = screen.getByRole('button', { name: /resolver conflito/i });
      await user.click(resolveButton);

      // Verify conflict resolution
      await waitFor(() => {
        expect(screen.getByText(/conflito resolvido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Student Workflow', () => {
    it('should allow student to view assignments and materials', async () => {
      const user = userEvent.setup();
      
      // Mock student authentication
      vi.mocked(require('@supabase/supabase-js').createClient().auth.getSession)
        .mockResolvedValue({
          data: {
            session: {
              user: { id: 'student-1', email: 'student@example.com' },
              access_token: 'token',
            },
          },
          error: null,
        });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to student portal
      await waitFor(() => {
        expect(screen.getByText(/minhas designações/i)).toBeInTheDocument();
      });

      // View assignment details
      const assignmentCard = screen.getByText(/leitura da bíblia/i);
      await user.click(assignmentCard);

      // Verify assignment details are shown
      await waitFor(() => {
        expect(screen.getByText(/ponto de estudo/i)).toBeInTheDocument();
      });

      // Access study materials
      const materialsButton = screen.getByRole('button', { name: /materiais/i });
      await user.click(materialsButton);

      // Verify materials are accessible
      await waitFor(() => {
        expect(screen.getByText(/material de estudo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Workflow', () => {
    it('should load pages within acceptable time limits', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      
      // Verify load time is under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle large datasets efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock large dataset
      const largeStudentList = Array.from({ length: 1000 }, (_, i) => ({
        id: `student-${i}`,
        name: `Student ${i}`,
        email: `student${i}@example.com`,
      }));

      vi.mocked(require('@supabase/supabase-js').createClient().from().select())
        .mockResolvedValue({ data: largeStudentList, error: null });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to students page
      const studentsLink = screen.getByText(/estudantes/i);
      await user.click(studentsLink);

      // Verify virtualization or pagination is working
      await waitFor(() => {
        const visibleStudents = screen.getAllByText(/Student \d+/);
        expect(visibleStudents.length).toBeLessThan(100); // Should not render all 1000
      });
    });
  });

  describe('Error Handling Workflow', () => {
    it('should gracefully handle network errors', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      vi.mocked(require('@supabase/supabase-js').createClient().from().select())
        .mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to students page
      const studentsLink = screen.getByText(/estudantes/i);
      await user.click(studentsLink);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });

      // Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle validation errors appropriately', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to students page and try to add invalid student
      const studentsLink = screen.getByText(/estudantes/i);
      await user.click(studentsLink);

      const addStudentButton = screen.getByRole('button', { name: /adicionar estudante/i });
      await user.click(addStudentButton);

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      });
    });
  });
});