import { useState, useCallback, useEffect } from 'react';
import { ValidationResult, ValidationIssue, validationEngine } from '../utils/validation';

interface FormField {
  name: string;
  value: any;
  validation?: ValidationIssue[];
  isValid?: boolean;
}

interface FormValidationState {
  fields: Record<string, FormField>;
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  touched: Record<string, boolean>;
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnSubmit?: boolean;
}

export const useFormValidation = (
  initialValues: Record<string, any> = {},
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsOnSubmit = true
  } = options;

  const [state, setState] = useState<FormValidationState>(() => {
    const fields: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(key => {
      fields[key] = {
        name: key,
        value: initialValues[key],
        validation: [],
        isValid: true
      };
    });

    return {
      fields,
      isValid: true,
      errors: [],
      warnings: [],
      touched: {}
    };
  });

  const [submitted, setSubmitted] = useState(false);

  // Update field value
  const setFieldValue = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          name,
          value
        }
      }
    }));
  }, []);

  // Set field validation
  const setFieldValidation = useCallback((name: string, validation: ValidationIssue[]) => {
    setState(prev => {
      const field = prev.fields[name] || { name, value: undefined };
      const errors = validation.filter(v => v.severity === 'error');
      const isValid = errors.length === 0;

      const newFields = {
        ...prev.fields,
        [name]: {
          ...field,
          validation,
          isValid
        }
      };

      // Recalculate overall form state
      const allErrors = Object.values(newFields).flatMap(f => 
        f.validation?.filter(v => v.severity === 'error') || []
      );
      const allWarnings = Object.values(newFields).flatMap(f => 
        f.validation?.filter(v => v.severity === 'warning') || []
      );

      return {
        ...prev,
        fields: newFields,
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      };
    });
  }, []);

  // Mark field as touched
  const setFieldTouched = useCallback((name: string, touched = true) => {
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: touched
      }
    }));
  }, []);

  // Validate specific field
  const validateField = useCallback((name: string, value?: any) => {
    const fieldValue = value !== undefined ? value : state.fields[name]?.value;
    
    // This is a simplified validation - in practice, you'd use specific schemas
    // based on the field name or form type
    let validation: ValidationIssue[] = [];

    // Basic required field validation
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      validation.push({
        field: name,
        message: 'This field is required',
        code: 'required',
        severity: 'error'
      });
    }

    setFieldValidation(name, validation);
    return validation;
  }, [state.fields, setFieldValidation]);

  // Validate student form
  const validateStudentForm = useCallback((data: any) => {
    const result = validationEngine.validateStudent(data);
    
    // Update field validations
    Object.keys(data).forEach(fieldName => {
      const fieldErrors = result.errors.filter(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
      const fieldWarnings = result.warnings.filter(w => w.field === fieldName || w.field.startsWith(`${fieldName}.`));
      const fieldValidation = [...fieldErrors, ...fieldWarnings];
      
      setFieldValidation(fieldName, fieldValidation);
    });

    return result;
  }, [setFieldValidation]);

  // Validate assignment form
  const validateAssignmentForm = useCallback((data: any, students: any[] = []) => {
    const result = validationEngine.validateAssignment(data, students);
    
    // Update field validations
    Object.keys(data).forEach(fieldName => {
      const fieldErrors = result.errors.filter(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
      const fieldWarnings = result.warnings.filter(w => w.field === fieldName || w.field.startsWith(`${fieldName}.`));
      const fieldValidation = [...fieldErrors, ...fieldWarnings];
      
      setFieldValidation(fieldName, fieldValidation);
    });

    return result;
  }, [setFieldValidation]);

  // Validate program form
  const validateProgramForm = useCallback((data: any) => {
    const result = validationEngine.validateProgram(data);
    
    // Update field validations
    Object.keys(data).forEach(fieldName => {
      const fieldErrors = result.errors.filter(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
      const fieldWarnings = result.warnings.filter(w => w.field === fieldName || w.field.startsWith(`${fieldName}.`));
      const fieldValidation = [...fieldErrors, ...fieldWarnings];
      
      setFieldValidation(fieldName, fieldValidation);
    });

    return result;
  }, [setFieldValidation]);

  // Validate all fields
  const validateAll = useCallback(() => {
    const fieldNames = Object.keys(state.fields);
    fieldNames.forEach(name => validateField(name));
    
    return state.isValid;
  }, [state.fields, state.isValid, validateField]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: Record<string, any>) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setSubmitted(true);

      // Mark all fields as touched
      const touchedFields: Record<string, boolean> = {};
      Object.keys(state.fields).forEach(name => {
        touchedFields[name] = true;
      });
      setState(prev => ({ ...prev, touched: touchedFields }));

      // Validate all fields
      const isValid = validateAll();

      if (isValid) {
        const values: Record<string, any> = {};
        Object.entries(state.fields).forEach(([name, field]) => {
          values[name] = field.value;
        });

        await onSubmit(values);
      }
    };
  }, [state.fields, validateAll]);

  // Reset form
  const reset = useCallback((newValues?: Record<string, any>) => {
    const values = newValues || initialValues;
    const fields: Record<string, FormField> = {};
    
    Object.keys(values).forEach(key => {
      fields[key] = {
        name: key,
        value: values[key],
        validation: [],
        isValid: true
      };
    });

    setState({
      fields,
      isValid: true,
      errors: [],
      warnings: [],
      touched: {}
    });
    setSubmitted(false);
  }, [initialValues]);

  // Get field props for form components
  const getFieldProps = useCallback((name: string) => {
    const field = state.fields[name];
    const shouldShowValidation = submitted || state.touched[name];

    return {
      value: field?.value || '',
      validation: shouldShowValidation ? field?.validation || [] : [],
      onValidationChange: (isValid: boolean) => {
        // This is handled by setFieldValidation
      }
    };
  }, [state.fields, state.touched, submitted]);

  // Auto-validate on change if enabled
  useEffect(() => {
    if (validateOnChange) {
      Object.keys(state.fields).forEach(name => {
        if (state.touched[name]) {
          validateField(name);
        }
      });
    }
  }, [validateOnChange, state.fields, state.touched, validateField]);

  return {
    // State
    fields: state.fields,
    isValid: state.isValid,
    errors: state.errors,
    warnings: state.warnings,
    touched: state.touched,
    submitted,

    // Actions
    setFieldValue,
    setFieldValidation,
    setFieldTouched,
    validateField,
    validateStudentForm,
    validateAssignmentForm,
    validateProgramForm,
    validateAll,
    handleSubmit,
    reset,
    getFieldProps,

    // Utilities
    getFieldValue: (name: string) => state.fields[name]?.value,
    getFieldValidation: (name: string) => state.fields[name]?.validation || [],
    isFieldValid: (name: string) => state.fields[name]?.isValid !== false,
    isFieldTouched: (name: string) => state.touched[name] || false
  };
};