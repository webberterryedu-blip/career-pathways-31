# Supabase Edge Functions - Sistema Ministerial

## Current Status

The Supabase Edge Functions have been implemented but cannot be deployed due to account permissions limitations. The free-tier Supabase accounts do not support Edge Functions deployment, which results in 403 Forbidden errors when the frontend attempts to call these functions.

## Implemented Edge Functions

Three Edge Functions have been created:

1. **list-programs-json** - Lists all available meeting programs
2. **generate-assignments** - Generates assignments using the S-38 algorithm
3. **save-assignments** - Saves assignments with S-38 validation

## Error Handling and Fallbacks

All frontend components have been updated with robust fallback mechanisms:

### DesignacoesPage.tsx
- **carregarSemanaAtual()**: Tries Edge Function → Backend API → Local fallback
- **gerarDesignacoes()**: Tries Edge Function → Local generator
- **salvarDesignacoes()**: Tries Edge Function → Backend API → Local storage draft

### ProgramasPage.tsx
- **carregarProgramasReais()**: Tries Edge Function → Backend API

## CORS Issues Explanation

The CORS errors in the browser console occur because:
1. The frontend attempts to call Edge Functions at URLs like:
   - `https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/list-programs-json`
2. These functions don't exist (403 error) so they can't respond to preflight OPTIONS requests
3. The browser blocks the requests due to CORS policy violations

## Solution Implemented

All frontend functions now properly handle these failures with try/catch blocks and fallback to alternative methods:

```typescript
try {
  // Try Edge Function first
  const { data, error } = await supabase.functions.invoke('function-name');
  
  if (data && data.success) {
    // Use Edge Function response
    return;
  }
  
  if (error) {
    throw new Error('Edge Function not available');
  }
} catch (edgeFunctionError) {
  // Fallback to backend API
  try {
    const response = await fetch('http://localhost:3001/api/...');
    // Process backend response
  } catch (backendError) {
    // Final fallback (local data, localStorage, etc.)
  }
}
```

## Next Steps for Deployment

To fully utilize the Edge Functions:

1. **Upgrade Supabase Account**: Move to a paid plan that supports Edge Functions
2. **Deploy Functions**: Run the deployment script:
   ```bash
   cd supabase
   supabase functions deploy list-programs-json --project-ref YOUR_PROJECT_ID
   supabase functions deploy generate-assignments --project-ref YOUR_PROJECT_ID
   supabase functions deploy save-assignments --project-ref YOUR_PROJECT_ID
   ```
3. **Configure Environment Variables**: Ensure proper Supabase keys are set

## Testing Edge Functions Locally

You can test the functions locally using the Supabase CLI:

```bash
# Start Supabase local development environment
supabase start

# Deploy functions to local environment
supabase functions deploy list-programs-json --local
supabase functions deploy generate-assignments --local
supabase functions deploy save-assignments --local

# Test functions
curl -X POST http://localhost:54321/functions/v1/list-programs-json \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## S-38 Algorithm Implementation

The generate-assignments function implements the official S-38 assignment rules:
- Gender restrictions for specific parts
- Role qualifications (elder, ministerial servant, etc.)
- Fair rotation system based on assignment history
- Assistant matching with family relationship support

## Validation Rules

The save-assignments function validates all assignments against S-38 rules:
- Bible reading requires male students
- Talks require qualified speakers
- Opening comments require elders/servants
- Assistant gender/family matching for demonstrations

## Current Fallback Behavior

The application continues to function normally using fallback mechanisms:
- Program data loaded from backend API or local mock data
- Assignments generated with simplified local algorithm
- Data saved to backend API or localStorage drafts