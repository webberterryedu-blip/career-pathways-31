-- ======================================================
-- 🚨 IMMEDIATE AUTHENTICATION FIX - SQL SOLUTION 🚨
-- ======================================================

-- This SQL script will create the missing profile for your user
-- You need to run this in your Supabase SQL Editor

-- First, let's check if the profile already exists
SELECT * FROM profiles WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- If no profile is returned, run this INSERT statement:
INSERT INTO profiles (
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
) VALUES (
    '1d112896-626d-4dc7-a758-0e5bec83fe6c',
    'frankwebber33@hotmail.com',
    'Frank Webber',
    'instrutor',
    NOW(),
    NOW()
);

-- After running the INSERT, verify the profile was created:
SELECT * FROM profiles WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- ======================================================
-- INSTRUCTIONS TO RUN THIS SQL:
-- 1. Go to https://app.supabase.com/project/jbapewpuvfijrkhlbsid
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Copy and paste this entire script
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Restart your development server: npm run dev:all
-- 6. Login at http://localhost:8080/auth with:
--    Email: frankwebber33@hotmail.com
--    Password: senha123
-- ======================================================