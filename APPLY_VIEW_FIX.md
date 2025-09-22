# 🛠️ Apply View Fix to Supabase Database

## Problem
The `vw_estudantes_grid` view is not properly defined or cached in your Supabase database, causing frontend errors when trying to access student data.

## Solution
Apply the correct view definition to your Supabase database.

## Steps to Apply the Fix

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the View Fix SQL
Copy and paste the following SQL into the editor and run it:

```sql
-- =====================================================
-- FIX vw_estudantes_grid VIEW DEFINITION
-- =====================================================

-- Drop the incorrect view
DROP VIEW IF EXISTS public.vw_estudantes_grid;

-- Create the correct view with proper column references
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.id,
  e.nome,
  e.genero,
  e.qualificacoes,
  e.ativo,
  e.congregacao_id as congregacao,
  e.user_id,
  e.profile_id,
  p.email,
  p.cargo,
  p.role,
  e.created_at,
  e.updated_at
FROM public.estudantes e
LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- VERIFY THE VIEW WAS CREATED CORRECTLY
SELECT COUNT(*) as record_count FROM public.vw_estudantes_grid LIMIT 1;
```

### Step 3: Restart Your Development Server
After applying the fix:
```bash
# From the project root directory
npm run dev
```

## Verification
After applying the fix, the frontend should:
- ✅ Load the student list without 404 errors
- ✅ Display all 27 student records properly
- ✅ Show student information with proper profile data

## Troubleshooting
If you still encounter issues:

1. **Check the view definition**:
   ```sql
   SELECT * FROM information_schema.views WHERE table_name = 'vw_estudantes_grid';
   ```

2. **Verify table structures**:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'estudantes' AND table_schema = 'public';
   
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'profiles' AND table_schema = 'public';
   ```

3. **Refresh the schema cache again**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```