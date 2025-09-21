# 🔧 Fix Database Issue - Missing View vw_estudantes_grid

## Problem
The frontend application is showing 404 errors when trying to access the `vw_estudantes_grid` view because it doesn't exist in your Supabase database. This is preventing the student list from loading properly.

## Solution
You need to apply the database migrations to create the missing view and ensure all required tables exist.

## Steps to Fix

### 1. Apply Database Migrations via Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query and run the following SQL commands:

```sql
-- CREATE THE MISSING vw_estudantes_grid VIEW
-- This view combines estudantes and profiles data for the application
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.id,
  e.nome,
  e.genero,
  e.qualificacoes,
  e.ativo,
  e.congregacao,
  e.user_id,
  e.profile_id,
  p.email,
  p.telefone,
  p.cargo,
  p.role,
  e.created_at,
  e.updated_at
FROM public.estudantes e
LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- VERIFY THE VIEW WAS CREATED
SELECT COUNT(*) as record_count FROM public.vw_estudantes_grid;
```

### 2. Alternative: Run Migrations Locally

If you prefer to run the migrations locally:

1. Make sure you have the Supabase CLI installed
2. Open a terminal in your project directory
3. Run the following command:

```bash
supabase db push
```

This will apply all pending migrations to your remote database.

### 3. Restart Your Development Server

After applying the database fixes:

1. Stop your current development server (Ctrl+C)
2. Start it again with:

```bash
npm run dev
```

## Verification

After applying the fixes, you should see:

1. No more 404 errors in the browser console for `vw_estudantes_grid`
2. The student list should load properly
3. The application should display the 27 student records you previously inserted

## Troubleshooting

If you still encounter issues:

1. Check that the `estudantes` table exists:
   ```sql
   SELECT COUNT(*) FROM public.estudantes;
   ```

2. Check that the `profiles` table exists:
   ```sql
   SELECT COUNT(*) FROM public.profiles;
   ```

3. If you get permission errors, make sure you're running the queries with a user that has proper database permissions (usually the service role).

## Additional Notes

The migration files in your project should have already created these database objects, but it seems they haven't been applied to your remote database yet. The steps above will manually apply the necessary changes to fix the missing view issue.