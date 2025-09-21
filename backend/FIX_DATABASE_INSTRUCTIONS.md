# Database Structure Fix Instructions

## Problem Summary

Your frontend application is encountering these issues:
1. **Missing View**: `vw_estudantes_grid` view doesn't exist
2. **Missing Table**: `congregacoes` table doesn't exist
3. **404 Errors**: Application can't fetch student data from the expected endpoints

## Solution Overview

This fix will:
1. Create the missing `congregacoes` table
2. Create the missing `vw_estudantes_grid` view
3. Enable proper data access for your frontend application

## Step-by-Step Instructions

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"+ New query"** to create a new query tab

### Step 2: Execute the Fix Script

Copy and paste the entire contents of `FIX_DATABASE_STRUCTURE.sql` into the SQL Editor:

```sql
-- =====================================================
-- FIX DATABASE STRUCTURE FOR MINISTERIAL SYSTEM
-- =====================================================

-- 1. CREATE CONGREGACOES TABLE
CREATE TABLE IF NOT EXISTS public.congregacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for congregacoes
ALTER TABLE public.congregacoes ENABLE ROW LEVEL SECURITY;

-- Insert sample congregations
INSERT INTO public.congregacoes (id, nome, cidade) VALUES
  ('78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 'Congregação Almeida', 'São Paulo'),
  ('11c5bc9d-5476-483f-b4f0-537ed70ade51', 'Congregação Costa', 'Rio de Janeiro'),
  ('b88f6190-0194-414f-b85e-68823d68a317', 'Congregação Goes', 'Belo Horizonte'),
  ('014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 'Congregação Gomes', 'Porto Alegre')
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE VW_ESTUDANTES_GRID VIEW
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

-- 3. REFRESH SCHEMA CACHE
-- Run this command after creating the view:
NOTIFY pgrst, 'reload schema';
```

### Step 3: Run the Query

1. Click the **"Run"** button to execute the SQL
2. You should see success messages for each command

### Step 4: Verify the Fix

Run the test script to verify the fixes worked:

```bash
cd C:\Users\webbe\Documents\GitHub\career-pathways-31\backend
node test-fixes.js
```

### Step 5: Restart Your Frontend Application

1. Stop your frontend development server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Files Created

- `FIX_DATABASE_STRUCTURE.sql` - Contains the SQL commands to fix the database
- `test-fixes.js` - Script to verify the fixes worked
- `fix-database-structure-alt.js` - Diagnostic script that identified the issues

## Expected Results

After applying these fixes:
- ✅ No more 404 errors for `vw_estudantes_grid`
- ✅ Student data should load correctly in the frontend
- ✅ Edge Functions should work properly
- ✅ CORS errors should be resolved

## Troubleshooting

If you still encounter issues:

1. **Check RLS Policies**: Ensure Row Level Security policies allow your user to access the data
2. **Verify API Keys**: Make sure your Supabase keys are correctly configured in `.env` files
3. **Clear Browser Cache**: Hard refresh your browser (Ctrl+F5)
4. **Check Network Tab**: Look for specific error messages in browser developer tools

## Need Help?

If you continue to have issues:
1. Run `node test-fixes.js` to get detailed diagnostics
2. Check the browser console for specific error messages
3. Verify all environment variables are correctly set