# Complete Fix for Database Schema and CORS Issues

## Problem Summary

The application is experiencing several critical errors:

1. **Column profiles.user_id does not exist** - The profiles table is missing the user_id column
2. **Cannot find relationship between 'estudantes' and 'profiles'** - Missing foreign key relationship
3. **CORS errors with Edge Functions** - Likely due to database query failures causing HTTP errors
4. **Missing vw_estudantes_grid view** - The application is trying to query a view that doesn't exist

## Root Cause Analysis

After examining the codebase, I found several issues:

1. **Schema Conflicts**: Multiple migration files define different versions of the same tables
2. **Missing Columns**: The [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) table is missing the [user_id](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20250115130000_fix_profiles_user_id_column.sql#L21-L21) column that's being referenced
3. **Foreign Key Issues**: The relationship between [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) and [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) tables is not properly established
4. **Missing View**: The `vw_estudantes_grid` view that the application depends on doesn't exist
5. **RLS Policy Issues**: Row Level Security policies may be preventing proper data access

## Solution

### Step 1: Apply Database Schema Fixes

1. Run the complete database fix script in Supabase SQL Editor:
   ```sql
   -- Execute complete-database-fix.sql
   ```

2. This script will:
   - Create/fixed the [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) table with all required columns
   - Create/fixed the [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) table with proper relationships
   - Set up proper Row Level Security policies
   - Create necessary indexes for performance
   - Insert test data if needed

### Step 2: Apply the Missing View Fix

1. Apply the new migration that creates the missing view:
   ```bash
   npx supabase migration up
   ```

2. This migration will:
   - Create the `vw_estudantes_grid` view that combines [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) and [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) data
   - Ensure all required columns exist in both tables
   - Link existing data properly

### Step 3: Reset and Reapply Migrations

1. Reset the database:
   ```bash
   npx supabase db reset
   ```

2. Apply migrations:
   ```bash
   npx supabase migration up
   ```

### Step 4: Restart Supabase Services

1. Stop Supabase:
   ```bash
   npx supabase stop
   ```

2. Start Supabase:
   ```bash
   npx supabase start
   ```

### Step 5: Deploy Updated Edge Functions

1. Redeploy the Edge Functions to ensure they have the latest database schema:
   ```bash
   npx supabase functions deploy save-assignments --project-ref nwpuurgwnnuejqinkvrh
   npx supabase functions deploy generate-assignments --project-ref nwpuurgwnnuejqinkvrh
   npx supabase functions deploy generate-treasures-assignments --project-ref nwpuurgwnnuejqinkvrh
   ```

## Files Created

1. **[complete-database-fix.sql](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\complete-database-fix.sql)** - Complete fix for all database schema issues
2. **[apply-database-fixes.bat](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\apply-database-fixes.bat)** - Batch script to apply fixes
3. **[fix-edge-functions-cors.sql](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\fix-edge-functions-cors.sql)** - Additional CORS fixes (if needed)
4. **[supabase/migrations/20250921100000_fix_missing_view_and_schema.sql](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20250921100000_fix_missing_view_and_schema.sql)** - Migration to create missing view and fix schema

## Expected Results

After applying these fixes, the following errors should be resolved:

1. ✅ `column profiles.user_id does not exist`
2. ✅ `Could not find a relationship between 'estudantes' and 'profiles'`
3. ✅ `vw_estudantes_grid` view not found
4. ✅ CORS errors related to database query failures

## Additional Notes

1. The Edge Functions already have proper CORS headers configured
2. The issue was primarily with the database schema and missing view, not the Edge Functions themselves
3. Make sure to backup your database before applying these fixes in production
4. Test the authentication flow after applying the fixes to ensure profiles load correctly
5. Test the student management features to ensure the view works properly

## Testing the Fix

1. **Test User Authentication**:
   - Try logging in with an existing user
   - Verify that the profile loads correctly
   - Check that the user role is properly assigned

2. **Test Student Management**:
   - Navigate to the student management page
   - Verify that students load correctly
   - Check that you can create/update students

3. **Test Assignment Generation**:
   - Try generating assignments
   - Verify that the algorithm can access student data
   - Check that assignments are saved correctly

4. **Test Edge Functions**:
   - Try calling the assignment generation function
   - Verify that CORS errors are resolved
   - Check that the function returns proper responses

If you encounter any issues after applying these fixes, please check the browser console and Supabase logs for additional error details.