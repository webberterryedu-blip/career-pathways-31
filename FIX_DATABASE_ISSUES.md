# Database Schema Issues Fix

## Problem Summary

The application is experiencing several database-related errors:

1. **Column profiles.user_id does not exist** - The profiles table is missing the user_id column
2. **Cannot find relationship between 'estudantes' and 'profiles'** - Missing foreign key relationship
3. **CORS errors with Edge Functions** - Likely due to database query failures causing HTTP errors

## Root Cause Analysis

After examining the migration files, I found several issues:

1. **Schema Conflicts**: Multiple migration files define different versions of the same tables
2. **Missing Columns**: The [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) table is missing the [user_id](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20250115130000_fix_profiles_user_id_column.sql#L21-L21) column that's being referenced
3. **Foreign Key Issues**: The relationship between [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) and [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) tables is not properly established
4. **RLS Policy Issues**: Row Level Security policies may be preventing proper data access

## Solution

### Step 1: Apply the Complete Database Fix

1. Run the complete database fix script:
   ```sql
   -- Execute complete-database-fix.sql in Supabase SQL Editor
   ```

2. This script will:
   - Create/fixed the [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) table with all required columns
   - Create/fixed the [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) table with proper relationships
   - Set up proper Row Level Security policies
   - Create necessary indexes for performance
   - Insert test data if needed

### Step 2: Reset and Reapply Migrations

1. Reset the database:
   ```bash
   npx supabase db reset
   ```

2. Apply migrations:
   ```bash
   npx supabase migration up
   ```

### Step 3: Restart Supabase Services

1. Stop Supabase:
   ```bash
   npx supabase stop
   ```

2. Start Supabase:
   ```bash
   npx supabase start
   ```

### Step 4: Verify the Fix

1. Check that the [profiles](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\src\pages\InstructorProgramacao.tsx#L57-L60) table has the [user_id](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20250115130000_fix_profiles_user_id_column.sql#L21-L21) column:
   ```sql
   \d public.profiles
   ```

2. Check that the [estudantes](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\supabase\migrations\20241215000001_create_ministerial_schema.sql#L71-L87) table has proper relationships:
   ```sql
   \d public.estudantes
   ```

3. Test user authentication and profile loading in the application

## Files Created

1. **[complete-database-fix.sql](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\complete-database-fix.sql)** - Complete fix for all database schema issues
2. **[apply-database-fixes.bat](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\apply-database-fixes.bat)** - Batch script to apply fixes
3. **[fix-edge-functions-cors.sql](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\fix-edge-functions-cors.sql)** - Additional CORS fixes (if needed)

## Expected Results

After applying these fixes, the following errors should be resolved:

1. ✅ `column profiles.user_id does not exist`
2. ✅ `Could not find a relationship between 'estudantes' and 'profiles'`
3. ✅ CORS errors related to database query failures

## Additional Notes

1. The Edge Functions already have proper CORS headers configured
2. The issue was primarily with the database schema, not the Edge Functions themselves
3. Make sure to backup your database before applying these fixes in production