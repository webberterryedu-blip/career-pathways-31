import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationIssue } from '../../utils/validation';
import { cn } from '../../lib/utils';
import { AlertTriangle, Info } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  validation?: ValidationIssue[];
  onValidationChange?: (isValid: boolean) => void;
  showValidationOnBlur?: boolean;
  required?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  validation = [],
  onValidationChange,
  showValidationOnBlur = true,
  required,
  className,
  ...props
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (showValidationOnBlur) {
      setShowValidation(true);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const shouldShowValidation = showValidation || touched;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
      )}
      
      <Input
        {...props}
        className={cn(
          className,
          hasErrors && shouldShowValidation && "border-red-500 focus:border-red-500",
          hasWarnings && !hasErrors && shouldShowValidation && "border-yellow-500 focus:border-yellow-500"
        )}
        onBlur={handleBlur}
        onFocus={handleFocus}
        data-error={hasErrors && shouldShowValidation}
        aria-invalid={hasErrors}
        aria-describedby={validation.length > 0 ? `${props.id}-validation` : undefined}
      />

      {shouldShowValidation && (errors.length > 0 || warnings.length > 0) && (
        <div id={`${props.id}-validation`} className="space-y-1">
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