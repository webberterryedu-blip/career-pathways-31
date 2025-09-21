-- RESET PASSWORD FOR frankwebber33@hotmail.com
-- Run this in your Supabase SQL Editor

-- First, let's check if the user exists
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'frankwebber33@hotmail.com';

-- To reset the password, you'll need to use the Supabase Dashboard
-- because passwords are hashed and cannot be set directly via SQL
-- for security reasons.

-- However, you can verify your user exists and is confirmed.

-- If you want to create a new test user with a known password:
-- 1. Go to Supabase Dashboard
-- 2. Authentication > Users
-- 3. Click "New User"
-- 4. Email: test@system.com
-- 5. Password: Test1234!
-- 6. Check "Email confirmed"
-- 7. Click "Create User"

-- Then run this to create the profile:
INSERT INTO profiles (user_id, email, nome, role, created_at, updated_at)
SELECT id, 'test@system.com', 'Test User', 'instrutor', NOW(), NOW()
FROM auth.users 
WHERE email = 'test@system.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'test@system.com'
);

-- If you need to update your existing profile (not the password, just profile data):
UPDATE profiles 
SET 
    email = 'frankwebber33@hotmail.com',
    nome = 'Frank Webber',
    role = 'instrutor',
    updated_at = NOW()
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- To verify your profile is correct:
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