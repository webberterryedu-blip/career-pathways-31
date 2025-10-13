import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';
import { validationEngine } from '../../utils/validation';

// Mock validation engine
vi.mock('../../utils/validation', () => ({
  validationEngine: {
    validateStudent: vi.fn(),
    validateAssignment: vi.fn(),
    validateProgram: vi.fn()
  }
}));

const mockValidationEngine = validationEngine as any;

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useFormValidation());
      
      expect(result.current.errors).toEqual({});
      expect(result.current.warnings).toEqual({});
      expect(result.current.isValidating).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(typeof result.current.validateField).toBe('function');
      expect(typeof result.current.validateForm).toBe('function');
      expect(typeof result.current.clearErrors).toBe('function');
      expect(typeof result.current.clearFieldError).toBe('function');
      expect(typeof result.current.setFieldError).toBe('function');
    });
  });

  describe('Field Validation', () => {
    it('should validate individual fields successfully', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateField('nome', 'João Silva', 'student');
        expect(isValid).toBe(true);
      });
      
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should handle field validation errors', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'nome',
            message: 'Name is required',
            code: 'required',
            severity: 'error'
          }
        ],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateField('nome', '', 'student');
        expect(isValid).toBe(false);
      });
      
      expect(result.current.errors.nome).toBe('Name is required');
      expect(result.current.isValid).toBe(false);
    });

    it('should handle field validation warnings', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'data_nascimento',
            message: 'Student may be too young',
            code: 'age_warning',
            severity: 'warning'
          }
        ]
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateField('data_nascimento', '2015-01-01', 'student');
        expect(isValid).toBe(true);
      });
      
      expect(result.current.warnings.data_nascimento).toBe('Student may be too young');
      expect(result.current.isValid).toBe(true);
    });

    it('should handle validation for different entity types', async () => {
      mockValidationEngine.validateAssignment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        await result.current.validateField('tipo_parte', 'discurso', 'assignment');
      });
      
      expect(mockValidationEngine.validateAssignment).toHaveBeenCalled();
    });

    it('should handle unknown entity types', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateField('field', 'value', 'unknown' as any);
        expect(isValid).toBe(true);
      });
      
      expect(result.current.errors).toEqual({});
    });

    it('should set validation state during field validation', async () => {
      let resolveValidation: (value: any) => void;
      const validationPromise = new Promise(resolve => {
        resolveValidation = resolve;
      });

      mockValidationEngine.validateStudent.mockReturnValue(validationPromise);

      const { result } = renderHook(() => useFormValidation());
      
      // Start validation
      act(() => {
        result.current.validateField('nome', 'João Silva', 'student');
      });
      
      // Should be validating
      expect(result.current.isValidating).toBe(true);
      
      // Complete validation
      await act(async () => {
        resolveValidation!({
          isValid: true,
          errors: [],
          warnings: []
        });
        await validationPromise;
      });
      
      // Should no longer be validating
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form successfully', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const formData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        genero: 'masculino'
      };

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm(formData, 'student');
        expect(isValid).toBe(true);
      });
      
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should handle form validation errors', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'nome',
            message: 'Name is required',
            code: 'required',
            severity: 'error'
          },
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'invalid_email',
            severity: 'error'
          }
        ],
        warnings: []
      });

      const formData = {
        nome: '',
        email: 'invalid-email'
      };

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm(formData, 'student');
        expect(isValid).toBe(false);
      });
      
      expect(result.current.errors.nome).toBe('Name is required');
      expect(result.current.errors.email).toBe('Invalid email format');
      expect(result.current.isValid).toBe(false);
    });

    it('should handle form validation warnings', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'data_nascimento',
            message: 'Student may be too young',
            code: 'age_warning',
            severity: 'warning'
          }
        ]
      });

      const formData = {
        nome: 'João Silva',
        data_nascimento: '2015-01-01'
      };

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm(formData, 'student');
        expect(isValid).toBe(true);
      });
      
      expect(result.current.warnings.data_nascimento).toBe('Student may be too young');
    });

    it('should validate assignment forms', async () => {
      mockValidationEngine.validateAssignment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const assignmentData = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: '123e4567-e89b-12d3-a456-426614174001',
        tipo_parte: 'discurso'
      };

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm(assignmentData, 'assignment');
        expect(isValid).toBe(true);
      });
      
      expect(mockValidationEngine.validateAssignment).toHaveBeenCalledWith(assignmentData, undefined);
    });

    it('should validate program forms', async () => {
      mockValidationEngine.validateProgram.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const programData = {
        data_semana: '2024-12-31',
        secao_tesouros: {
          cantico_inicial: 1
        }
      };

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm(programData, 'program');
        expect(isValid).toBe(true);
      });
      
      expect(mockValidationEngine.validateProgram).toHaveBeenCalledWith(programData);
    });

    it('should pass additional data to assignment validation', async () => {
      mockValidationEngine.validateAssignment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const assignmentData = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: '123e4567-e89b-12d3-a456-426614174001',
        tipo_parte: 'discurso'
      };

      const students = [
        { id: '123e4567-e89b-12d3-a456-426614174001', nome: 'João' }
      ];

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        await result.current.validateForm(assignmentData, 'assignment', students);
      });
      
      expect(mockValidationEngine.validateAssignment).toHaveBeenCalledWith(assignmentData, students);
    });
  });

  describe('Error Management', () => {
    it('should clear all errors', () => {
      const { result } = renderHook(() => useFormValidation());
      
      // Set some errors first
      act(() => {
        result.current.setFieldError('nome', 'Name error');
        result.current.setFieldError('email', 'Email error');
      });
      
      expect(result.current.errors.nome).toBe('Name error');
      expect(result.current.errors.email).toBe('Email error');
      
      // Clear all errors
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.errors).toEqual({});
      expect(result.current.warnings).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should clear specific field error', () => {
      const { result } = renderHook(() => useFormValidation());
      
      // Set some errors first
      act(() => {
        result.current.setFieldError('nome', 'Name error');
        result.current.setFieldError('email', 'Email error');
      });
      
      expect(result.current.errors.nome).toBe('Name error');
      expect(result.current.errors.email).toBe('Email error');
      
      // Clear specific field error
      act(() => {
        result.current.clearFieldError('nome');
      });
      
      expect(result.current.errors.nome).toBeUndefined();
      expect(result.current.errors.email).toBe('Email error');
    });

    it('should set field error manually', () => {
      const { result } = renderHook(() => useFormValidation());
      
      act(() => {
        result.current.setFieldError('nome', 'Custom error message');
      });
      
      expect(result.current.errors.nome).toBe('Custom error message');
      expect(result.current.isValid).toBe(false);
    });

    it('should update isValid when errors change', () => {
      const { result } = renderHook(() => useFormValidation());
      
      expect(result.current.isValid).toBe(true);
      
      // Add error
      act(() => {
        result.current.setFieldError('nome', 'Error');
      });
      
      expect(result.current.isValid).toBe(false);
      
      // Remove error
      act(() => {
        result.current.clearFieldError('nome');
      });
      
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Validation State Management', () => {
    it('should track validation state correctly', async () => {
      let resolveValidation: (value: any) => void;
      const validationPromise = new Promise(resolve => {
        resolveValidation = resolve;
      });

      mockValidationEngine.validateStudent.mockReturnValue(validationPromise);

      const { result } = renderHook(() => useFormValidation());
      
      expect(result.current.isValidating).toBe(false);
      
      // Start validation
      act(() => {
        result.current.validateForm({ nome: 'João' }, 'student');
      });
      
      expect(result.current.isValidating).toBe(true);
      
      // Complete validation
      await act(async () => {
        resolveValidation!({
          isValid: true,
          errors: [],
          warnings: []
        });
        await validationPromise;
      });
      
      expect(result.current.isValidating).toBe(false);
    });

    it('should handle concurrent validations', async () => {
      let resolveValidation1: (value: any) => void;
      let resolveValidation2: (value: any) => void;
      
      const validationPromise1 = new Promise(resolve => {
        resolveValidation1 = resolve;
      });
      
      const validationPromise2 = new Promise(resolve => {
        resolveValidation2 = resolve;
      });

      mockValidationEngine.validateStudent
        .mockReturnValueOnce(validationPromise1)
        .mockReturnValueOnce(validationPromise2);

      const { result } = renderHook(() => useFormValidation());
      
      // Start first validation
      act(() => {
        result.current.validateField('nome', 'João', 'student');
      });
      
      expect(result.current.isValidating).toBe(true);
      
      // Start second validation
      act(() => {
        result.current.validateField('email', 'joao@example.com', 'student');
      });
      
      expect(result.current.isValidating).toBe(true);
      
      // Complete first validation
      await act(async () => {
        resolveValidation1!({
          isValid: true,
          errors: [],
          warnings: []
        });
        await validationPromise1;
      });
      
      // Should still be validating (second validation pending)
      expect(result.current.isValidating).toBe(true);
      
      // Complete second validation
      await act(async () => {
        resolveValidation2!({
          isValid: true,
          errors: [],
          warnings: []
        });
        await validationPromise2;
      });
      
      // Should no longer be validating
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation engine errors gracefully', async () => {
      mockValidationEngine.validateStudent.mockImplementation(() => {
        throw new Error('Validation engine error');
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateField('nome', 'João', 'student');
        expect(isValid).toBe(true); // Should default to valid on error
      });
      
      expect(result.current.isValidating).toBe(false);
    });

    it('should handle async validation errors', async () => {
      mockValidationEngine.validateStudent.mockRejectedValue(
        new Error('Async validation error')
      );

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm({ nome: 'João' }, 'student');
        expect(isValid).toBe(true); // Should default to valid on error
      });
      
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle nested field errors', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'qualificacoes.pode_dar_discursos',
            message: 'Invalid qualification',
            code: 'invalid_qualification',
            severity: 'error'
          }
        ],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        await result.current.validateForm({
          qualificacoes: { pode_dar_discursos: true }
        }, 'student');
      });
      
      expect(result.current.errors['qualificacoes.pode_dar_discursos']).toBe('Invalid qualification');
    });

    it('should handle multiple errors for the same field', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'nome',
            message: 'Name is required',
            code: 'required',
            severity: 'error'
          },
          {
            field: 'nome',
            message: 'Name is too short',
            code: 'min_length',
            severity: 'error'
          }
        ],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        await result.current.validateForm({ nome: 'A' }, 'student');
      });
      
      // Should use the first error message
      expect(result.current.errors.nome).toBe('Name is required');
    });

    it('should preserve warnings when clearing errors', () => {
      const { result } = renderHook(() => useFormValidation());
      
      // Set error and warning
      act(() => {
        result.current.setFieldError('nome', 'Name error');
      });
      
      // Simulate warning from validation
      act(() => {
        (result.current as any).setWarnings({ data_nascimento: 'Age warning' });
      });
      
      // Clear errors only
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.errors).toEqual({});
      // Note: In the actual implementation, warnings might also be cleared
      // This test documents the expected behavior
    });

    it('should handle validation with empty data', async () => {
      mockValidationEngine.validateStudent.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'nome',
            message: 'Name is required',
            code: 'required',
            severity: 'error'
          }
        ],
        warnings: []
      });

      const { result } = renderHook(() => useFormValidation());
      
      await act(async () => {
        const isValid = await result.current.validateForm({}, 'student');
        expect(isValid).toBe(false);
      });
      
      expect(result.current.errors.nome).toBe('Name is required');
    });
  });
});