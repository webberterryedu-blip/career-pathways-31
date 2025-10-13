/**
 * Assignment Generation System - Export Index
 * 
 * This file exports all the assignment generation components and services
 * for easy importing throughout the application.
 */

// Core Services
export { AssignmentEngine, createAssignmentEngine, generateAssignments } from '@/services/assignmentEngine';
export { 
  AssignmentValidator, 
  createAssignmentValidator, 
  validateAssignments, 
  validateAssignment,
  getValidationRules,
  getValidationRulesByCategory,
  getValidationRule
} from '@/services/assignmentValidator';

// UI Components
export { AssignmentGenerationModal } from './AssignmentGenerationModal';
export { ConflictResolutionPanel } from './ConflictResolutionPanel';
export { AssignmentPreview } from './AssignmentPreview';

// Types (re-exported for convenience)
export type { ValidationResult, ValidationError, ValidationRule, ValidationContext } from '@/services/assignmentValidator';