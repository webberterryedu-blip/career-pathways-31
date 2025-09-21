-- VERIFY AND FIX PROFILE
-- This script verifies your profile is correct and fixes any issues

-- 1. First, let's check what profiles exist with your user_id
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

-- 2. Let's also check if there's a profile with your email but different user_id
SELECT 
    id,
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'frankwebber33@hotmail.com';

-- 3. Let's check the auth.users table to verify your user exists
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'frankwebber33@hotmail.com';

-- 4. If a profile exists but has incorrect data, update it:
UPDATE profiles 
SET 
    email = 'frankwebber33@hotmail.com',
    nome = 'Frank Webber',
    role = 'instrutor',
    updated_at = NOW()
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- 5. If no profile exists, create it:
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

-- 6. Verify the fix worked
SELECT 
    'PROFILE VERIFICATION COMPLETE' as status,
    id,
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';