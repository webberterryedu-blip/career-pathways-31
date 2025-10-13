# Error Handling and Validation Tests

This directory contains comprehensive tests for the error handling and validation systems implemented in task 7.4.

## Test Files Created

### 1. `errorHandler.test.ts`
Comprehensive tests for the error handling system including:
- **Singleton Pattern**: Tests that ErrorHandler follows singleton pattern
- **Error Type Detection**: Tests for detecting different error types (database, network, validation, etc.)
- **Error Message Extraction**: Tests for extracting messages from various error formats
- **Recovery Actions**: Tests for generating appropriate recovery actions for different error types
- **Supabase Error Handling**: Specific tests for handling Supabase database errors
- **Network Error Handling**: Tests for network-related error scenarios
- **Validation Error Handling**: Tests for form validation error processing
- **Error Logging**: Tests for error logging and monitoring functionality
- **Context Handling**: Tests for including contextual information with errors
- **Utility Functions**: Tests for `handleAsyncError` and `withErrorHandling` utilities

### 2. `validation.test.ts`
Comprehensive tests for the validation engine including:
- **Student Validation**: Tests for validating student data with all business rules
- **Assignment Validation**: Tests for assignment validation including S-38 rules
- **Program Validation**: Tests for meeting program validation
- **S-38 Rule Validation**: Specific tests for Jehovah's Witness meeting assignment rules
- **Scheduling Validation**: Tests for assignment scheduling constraints
- **Schema Validation**: Tests for Zod schema validation
- **Utility Functions**: Tests for validation helper functions

### 3. `offlineStorage.test.ts`
Tests for offline data storage functionality including:
- **Database Initialization**: Tests for IndexedDB setup and configuration
- **Cache Operations**: Tests for storing and retrieving cached data
- **Pending Operations**: Tests for queuing operations when offline
- **Metadata Operations**: Tests for sync metadata management
- **Error Handling**: Tests for handling storage errors and quota limits
- **Database Management**: Tests for clearing data and getting storage info

### 4. `offlineSync.test.ts`
Tests for offline synchronization manager including:
- **Network Event Handling**: Tests for online/offline state management
- **Data Operations**: Tests for CRUD operations with offline support
- **Sync Operations**: Tests for synchronizing pending operations
- **Status Management**: Tests for sync status tracking
- **Auto-sync**: Tests for automatic synchronization
- **Preload Operations**: Tests for preloading essential data

## Hook Tests

### 5. `useErrorHandler.test.tsx`
Tests for the error handler React hook including:
- **Hook Initialization**: Tests for proper hook setup
- **Error Handling Functions**: Tests for all error handling methods
- **Async Error Handling**: Tests for handling async operations
- **Function Stability**: Tests for React hook optimization
- **Error Notification Integration**: Tests for UI error display

### 6. `useFormValidation.test.tsx`
Tests for the form validation React hook including:
- **Field Validation**: Tests for individual field validation
- **Form Validation**: Tests for complete form validation
- **Error Management**: Tests for error state management
- **Validation State**: Tests for loading and validation states
- **Complex Scenarios**: Tests for nested fields and multiple errors

### 7. `useOfflineData.test.tsx`
Tests for the offline data React hook including:
- **Data Operations**: Tests for CRUD operations with offline support
- **Sync Operations**: Tests for data synchronization
- **Loading States**: Tests for loading state management
- **Optimistic Updates**: Tests for immediate UI updates
- **Error Handling**: Tests for error recovery mechanisms

## Test Coverage

The tests cover the following requirements from task 7.4:

### ✅ Error Handling Scenarios and Recovery Mechanisms
- Network errors with retry and offline mode options
- Database errors with appropriate user messages
- Validation errors with field-specific guidance
- Authentication/authorization errors with login prompts
- Generic error handling with fallback messages
- Error logging and monitoring integration
- Recovery action execution and error scrolling

### ✅ Validation Rule Enforcement and Error Messaging
- Student data validation with age, email, phone validation
- Assignment validation with S-38 rule enforcement
- Program validation with time limits and duplicate detection
- Gender-based assignment restrictions
- Qualification requirements for different assignment types
- Scheduling constraints and frequency warnings
- Nested field validation and multiple error handling

### ✅ Offline Functionality and Data Synchronization
- IndexedDB storage for cached data and pending operations
- Network state detection and event handling
- Automatic synchronization when connection is restored
- Optimistic updates for better user experience
- Conflict resolution and error recovery
- Data preloading for essential tables
- Sync status tracking and listener management

## Running the Tests

To run all error handling and validation tests:

```bash
# Run all tests in this directory
npm test src/utils/__tests__/

# Run specific test files
npm test src/utils/__tests__/errorHandler.test.ts
npm test src/utils/__tests__/validation.test.ts
npm test src/utils/__tests__/offlineStorage.test.ts

# Run hook tests
npm test src/hooks/__tests__/useErrorHandler.test.tsx
npm test src/hooks/__tests__/useFormValidation.test.tsx
npm test src/hooks/__tests__/useOfflineData.test.tsx

# Run offline sync tests
npm test src/services/__tests__/offlineSync.test.ts
```

## Test Quality

All tests follow best practices:
- **Comprehensive Coverage**: Tests cover happy paths, error cases, and edge cases
- **Isolation**: Each test is independent with proper setup and teardown
- **Mocking**: External dependencies are properly mocked
- **Assertions**: Clear and specific assertions with meaningful error messages
- **Documentation**: Tests serve as documentation for expected behavior
- **Performance**: Tests run quickly and don't depend on external services

## Integration with CI/CD

These tests are designed to run in continuous integration environments and provide:
- Fast execution times
- Reliable results without flaky behavior
- Clear failure messages for debugging
- Coverage reporting integration
- No external dependencies or network calls