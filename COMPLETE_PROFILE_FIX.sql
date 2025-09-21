-- ======================================================
-- COMPLETE PROFILE FIX - RESOLVE AUTHENTICATION ISSUE
-- ======================================================

-- First, let's check what profiles exist with your user_id
SELECT 
    id,
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- If a profile exists but has incorrect data, update it:
UPDATE profiles 
SET 
    email = 'frankwebber33@hotmail.com',
    nome = 'Frank Webber',
    role = 'instrutor',
    updated_at = NOW()
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- If no profile exists, create it:
INSERT INTO profiles (
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
) 
SELECT 
    '1d112896-626d-4dc7-a758-0e5bec83fe6c',
    'frankwebber33@hotmail.com',
    'Frank Webber',
    'instrutor',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c'
);

-- Verify the profile was created/updated correctly:
SELECT 
    id,
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- ======================================================
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com/project/jbapewpuvfijrkhlbsid
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Copy and paste this entire script
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Restart your development server: npm run dev:all
-- 6. Login at http://localhost:8080/auth with:
--    Email: frankwebber33@hotmail.com
--    Password: senha123
-- ======================================================