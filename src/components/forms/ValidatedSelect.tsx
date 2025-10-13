import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { ValidationIssue } from '../../utils/validation';
import { cn } from '../../lib/utils';
import { AlertTriangle, Info } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  validation?: ValidationIssue[];
  onValidationChange?: (isValid: boolean) => void;
  showValidationOnBlur?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  validation = [],
  onValidationChange,
  showValidationOnBlur = true,
  required,
  disabled,
  className,
  id
}) => {
  const [showValidation, setShowValidation] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = validation.filter(v => v.severity === 'error');
  const warnings = validation.filter(v => v.severity === 'warning');
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(!hasErrors);
    }
  }, [hasErrors, onValidationChange]);

  const handleValueChange = (newValue: string) => {
    setTouched(true);
    if (showValidationOnBlur) {
      setShowValidation(true);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const shouldShowValidation = showValidation || touched;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={cn(
            className,
            hasErrors && shouldShowValidation && "border-red-500 focus:border-red-500",
            hasWarnings && !hasErrors && shouldShowValidation && "border-yellow-500 focus:border-yellow-500"
          )}
          data-error={hasErrors && shouldShowValidation}
          aria-invalid={hasErrors}
          aria-describedby={validation.length > 0 ? `${id}-validation` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {shouldShowValidation && (errors.length > 0 || warnings.length > 0) && (
        <div id={`${id}-validation`} className="space-y-1">
          {errors.map((error, index) => (
            <Alert key={`error-${index}`} variant="destructive" className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          ))}
          
          {warnings.map((warning, index) => (
            <Alert key={`warning-${index}`} className="py-2 border-yellow-500 text-yellow-700">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {warning.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};