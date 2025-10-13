# Page Migration Tests

This directory contains comprehensive tests for all migrated pages to ensure layout consistency, navigation integration, enhanced functionality, and responsive behavior.

## Test Coverage

### Dashboard.test.tsx
Tests for the migrated Dashboard page including:
- **Layout Consistency**: Verifies UnifiedLayout usage and main sections
- **Navigation Integration**: Tests navigation to other pages via quick actions
- **Enhanced Functionality**: Validates statistics display and assignment overview
- **Responsive Behavior**: Checks responsive grid layouts
- **Data Integration**: Tests context integration and loading states
- **Error Handling**: Validates graceful error handling

### EstudantesPage.test.tsx
Tests for the migrated Students page including:
- **Layout Consistency**: Verifies UnifiedLayout and tab structure
- **Navigation Integration**: Tests tab switching and form interactions
- **Enhanced Functionality**: Validates student management, qualifications, and history
- **Responsive Behavior**: Checks responsive layouts for cards and grids
- **Data Integration**: Tests loading, error, and empty states
- **Form Interactions**: Validates CRUD operations
- **Import Functionality**: Tests enhanced import features
- **Context Integration**: Verifies StudentContext and AssignmentContext usage

### ProgramasPage.test.tsx
Tests for the migrated Programs page including:
- **Layout Consistency**: Verifies UnifiedLayout and tab structure
- **Navigation Integration**: Tests tab switching and program selection
- **Enhanced Functionality**: Validates program loading, PDF import, and resources
- **Responsive Behavior**: Checks responsive layouts
- **Data Integration**: Tests Supabase Edge Functions and fallback APIs
- **PDF Processing**: Validates PDF upload and extraction
- **Program Management**: Tests program activation and persistence
- **Error Handling**: Validates network error handling
- **Context Integration**: Verifies ProgramContext usage

### DesignacoesPage.test.tsx
Tests for the migrated Assignments page including:
- **Layout Consistency**: Verifies UnifiedLayout and configuration sections
- **Navigation Integration**: Tests program loading and navigation
- **Enhanced Functionality**: Validates S-38 algorithm integration and assignment management
- **Responsive Behavior**: Checks responsive layouts
- **Data Integration**: Tests Supabase Edge Functions and local fallbacks
- **Assignment Management**: Validates assignment generation, saving, and editing
- **Error Handling**: Tests network errors and validation errors
- **Context Integration**: Verifies AssignmentContext and StudentContext usage
- **Program Management**: Tests program selection and persistence

### RelatoriosPage.test.tsx
Tests for the migrated Reports page including:
- **Layout Consistency**: Verifies UnifiedLayout and analytics sections
- **Navigation Integration**: Tests report type switching
- **Enhanced Functionality**: Validates real-time analytics and report generation
- **Responsive Behavior**: Checks responsive grid layouts
- **Data Integration**: Tests Supabase Edge Functions and export functionality
- **Report Types**: Validates different report types (engagement, performance, etc.)
- **Error Handling**: Tests Supabase errors and missing data
- **Context Integration**: Verifies all context usage
- **Date Range Filtering**: Tests date range inputs and filtering
- **Advanced Features**: Validates advanced qualifications and congregation filtering

## Test Requirements Covered

All tests verify compliance with the following requirements from the task:

### Requirement 1.1 - Centralized Dashboard
- ✅ Unified dashboard with navigation to all sections
- ✅ Consistent layout and styling across pages
- ✅ Single view for assignments, students, and programs

### Requirement 1.2 - Consistent Layout
- ✅ UnifiedLayout component usage across all pages
- ✅ Consistent navigation and breadcrumb systems
- ✅ Responsive design patterns

### Requirement 1.3 - Enhanced User Experience
- ✅ Quick action buttons and status indicators
- ✅ Real-time data updates and notifications
- ✅ Improved mobile experience

## Running the Tests

### Run all page migration tests:
```bash
npm test src/pages/__tests__
```

### Run specific page tests:
```bash
npm test src/pages/__tests__/Dashboard.test.tsx
npm test src/pages/__tests__/EstudantesPage.test.tsx
npm test src/pages/__tests__/ProgramasPage.test.tsx
npm test src/pages/__tests__/DesignacoesPage.test.tsx
npm test src/pages/__tests__/RelatoriosPage.test.tsx
```

### Run tests with coverage:
```bash
npm test -- --coverage src/pages/__tests__
```

### Run tests in watch mode:
```bash
npm test -- --watch src/pages/__tests__
```

## Test Structure

Each test file follows a consistent structure:

1. **Setup and Mocking**: Mock all dependencies and child components
2. **Layout Consistency**: Test UnifiedLayout usage and main sections
3. **Navigation Integration**: Test navigation between pages and sections
4. **Enhanced Functionality**: Test new features and improvements
5. **Responsive Behavior**: Test responsive design patterns
6. **Data Integration**: Test context usage and data handling
7. **Error Handling**: Test error states and graceful degradation
8. **Context Integration**: Test integration with new context providers

## Mock Strategy

- **UnifiedLayout**: Mocked to verify usage without rendering complexity
- **Child Components**: Mocked with test IDs for interaction testing
- **Contexts**: Mocked with realistic return values for testing
- **External APIs**: Mocked Supabase and fetch calls
- **Router**: Mocked navigation functions for testing

## Coverage Goals

- **Layout Consistency**: 100% coverage of UnifiedLayout integration
- **Navigation**: 100% coverage of navigation paths and interactions
- **Functionality**: 90%+ coverage of enhanced features
- **Responsive**: 100% coverage of responsive design classes
- **Error Handling**: 100% coverage of error scenarios
- **Context Integration**: 100% coverage of context usage

## Maintenance

When adding new features to pages:

1. Add corresponding tests to the relevant test file
2. Update mocks if new dependencies are added
3. Ensure responsive behavior is tested
4. Add error handling tests for new functionality
5. Update this README if test structure changes

## Dependencies

These tests require the following testing utilities:
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for testing

All dependencies are already configured in the project's test setup.