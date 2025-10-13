# Assignment Generation System

This module provides a comprehensive assignment generation system for Christian Life and Ministry Meeting assignments, following S-38 rules and guidelines.

## Features

- **S-38 Rule Enforcement**: Automatically enforces all S-38 rules for gender requirements, qualifications, and assistant pairings
- **Intelligent Distribution**: Balances assignments fairly among qualified students based on recent assignment history
- **Conflict Detection**: Identifies and provides suggestions for resolving assignment conflicts
- **Real-time Validation**: Provides immediate feedback on assignment validity with detailed error messages
- **Assistant Matching**: Automatically finds suitable assistants following S-38 pairing rules
- **Family Relationship Support**: Prefers family member pairings when appropriate
- **Comprehensive UI**: Full-featured modal interface with preview, conflict resolution, and approval workflow

## Core Components

### 1. Assignment Engine (`assignmentEngine.ts`)
The core algorithm that generates assignments following S-38 rules.

```typescript
import { generateAssignments } from '@/services/assignmentEngine';

const result = await generateAssignments(
  students,
  studentQualifications,
  assignmentHistories,
  familyRelationships,
  {
    data_inicio_semana: '2024-01-15',
    id_programa: 'program-id',
    partes: programParts,
    excluir_estudante_ids: [],
    preferir_pares_familiares: true
  }
);
```

### 2. Assignment Validator (`assignmentValidator.ts`)
Validates assignments against S-38 rules and provides detailed feedback.

```typescript
import { validateAssignments } from '@/services/assignmentValidator';

const validationResult = validateAssignments(assignments, {
  students: studentMap,
  qualifications: qualificationsMap,
  familyRelationships: familyMap,
  assignmentHistory: historyMap,
  weekDate: '2024-01-15',
  existingAssignments: []
});
```

### 3. Assignment Generation Modal (`AssignmentGenerationModal.tsx`)
Complete UI for generating assignments with options, preview, and conflict resolution.

```typescript
import { AssignmentGenerationModal } from '@/components/assignment';

<AssignmentGenerationModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  weekDate="2024-01-15"
  programId="program-id"
/>
```

## S-38 Rules Implemented

### Part 3 - Bible Reading
- ✅ Men only
- ✅ Must be qualified for Bible reading
- ✅ No assistant required

### Parts 4-7 - Ministry Parts
- ✅ Talks: Qualified men only (elders, ministerial servants, baptized publishers)
- ✅ Demonstrations: Both genders allowed
- ✅ Assistant requirements for demonstrations
- ✅ Same-gender assistants preferred
- ✅ Different-gender pairs must be family members
- ✅ Minors must have same-gender assistants (unless family)

### Distribution Rules
- ✅ Balanced distribution over 8-week periods
- ✅ No consecutive week assignments (warning)
- ✅ Priority based on recent assignment history
- ✅ Active students only
- ✅ Qualification-based eligibility

## Usage Examples

### Basic Assignment Generation

```typescript
import { useAssignmentGeneration } from '@/hooks/useAssignmentGeneration';

function AssignmentPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Open the generation modal
    setIsModalOpen(true);
  };

  return (
    <div>
      <Button onClick={handleGenerate}>
        Generate Assignments
      </Button>
      
      <AssignmentGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weekDate={selectedWeek}
        programId={selectedProgram}
      />
    </div>
  );
}
```

### Custom Validation

```typescript
import { validateAssignment, ValidationContext } from '@/components/assignment';

const context: ValidationContext = {
  students: new Map(students.map(s => [s.id, s])),
  qualifications: qualificationsMap,
  familyRelationships: familyMap,
  assignmentHistory: historyMap,
  weekDate: '2024-01-15',
  existingAssignments: []
};

const result = validateAssignment(assignment, context);

if (!result.isValid) {
  console.log('Validation errors:', result.errors);
  console.log('Warnings:', result.warnings);
}
```

### Conflict Resolution

```typescript
import { ConflictResolutionPanel } from '@/components/assignment';

<ConflictResolutionPanel
  conflicts={detectedConflicts}
  validationResult={validationResult}
  assignments={assignments}
  students={students}
  onResolveConflict={(index, resolution) => {
    // Handle conflict resolution
    handleConflictResolution(index, resolution);
  }}
  onAutoResolve={() => {
    // Handle automatic conflict resolution
    handleAutoResolve();
  }}
/>
```

## Integration with Existing System

The assignment generation system integrates seamlessly with the existing contexts:

- **AssignmentContext**: Uses `createAssignment` to save generated assignments
- **StudentContext**: Retrieves student data and qualifications
- **ProgramContext**: Gets program information and part definitions

## Performance Considerations

- **Lazy Loading**: Components are designed for lazy loading to reduce initial bundle size
- **Memoization**: Expensive calculations are memoized to prevent unnecessary re-renders
- **Batch Operations**: Multiple assignments are processed in batches for better performance
- **Optimistic Updates**: UI updates optimistically while background operations complete

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors**: Clear messages with suggestions for resolution
- **Generation Failures**: Graceful fallbacks with detailed error reporting
- **Network Issues**: Retry mechanisms and offline support
- **Data Consistency**: Validation ensures data integrity throughout the process

## Testing

Each component includes comprehensive test coverage:

- **Unit Tests**: Core algorithm logic and validation rules
- **Integration Tests**: Component interaction and data flow
- **E2E Tests**: Complete user workflows from generation to approval

## Future Enhancements

- **Machine Learning**: Improve assignment quality based on historical success
- **Advanced Scheduling**: Multi-week assignment planning
- **Mobile Optimization**: Enhanced mobile experience for assignment management
- **Accessibility**: Full WCAG 2.1 compliance for all components