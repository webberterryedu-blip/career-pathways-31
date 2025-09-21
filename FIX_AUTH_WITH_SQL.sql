-- COMPLETE AUTHENTICATION FIX FOR frankwebber33@hotmail.com
-- This script addresses the REAL issue causing "Invalid login credentials"

-- STEP 1: Verify the user exists in auth.users
SELECT 
    id as auth_user_id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'frankwebber33@hotmail.com';

-- STEP 2: Verify the profile exists with correct user_id
SELECT 
    id as profile_id,
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'frankwebber33@hotmail.com';

-- STEP 3: CHECK IF THERE'S A USER_ID MISMATCH (common cause of auth issues)
-- This compares the auth user ID with the profile user_id
SELECT 
    u.id as auth_user_id,
    p.id as profile_id,
    p.user_id as profile_user_id,
    u.email,
    CASE 
        WHEN u.id = p.user_id THEN 'MATCH - OK'
        ELSE 'MISMATCH - NEEDS FIX'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.email = p.email
WHERE u.email = 'frankwebber33@hotmail.com';

-- STEP 4: FIX USER_ID MISMATCH (if found)
-- This updates the profile to have the correct user_id from auth.users
UPDATE public.profiles 
SET user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'frankwebber33@hotmail.com'
)
WHERE email = 'frankwebber33@hotmail.com'
AND user_id != (
    SELECT id 
    FROM auth.users 
    WHERE email = 'frankwebber33@hotmail.com'
);

-- STEP 5: VERIFY THE FIX WORKED
SELECT 
    u.id as auth_user_id,
    p.id as profile_id,
    p.user_id as profile_user_id,
    u.email,
    CASE 
        WHEN u.id = p.user_id THEN 'MATCH - FIXED!'
        ELSE 'STILL MISMATCHED'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.email = p.email
WHERE u.email = 'frankwebber33@hotmail.com';

-- STEP 6: CREATE A NEW TEST USER IF NEEDED
-- If the above doesn't work, create a completely new user
-- First create the auth user (this must be done in Supabase Dashboard)
-- Then run this to create the profile:

/*
INSERT INTO public.profiles (user_id, email, nome, role, created_at, updated_at)
SELECT id, 'test@system.com', 'Test User', 'instrutor', NOW(), NOW()
FROM auth.users 
WHERE email = 'test@system.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'test@system.com'
);
*/

-- STEP 7: FINAL VERIFICATION
-- Run this to confirm everything is working
SELECT 
    'AUTHENTICATION SYSTEM STATUS' as check_type,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.user_id IS NOT NULL as profile_exists,
    u.id = p.user_id as user_id_match,
    'READY FOR LOGIN' as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'frankwebber33@hotmail.com';

-- STEP 8: ADDITIONAL VERIFICATION FOR ROLE
-- Ensure the user has the correct role assigned
SELECT 
    p.email,
    p.nome,
    p.role,
    CASE 
        WHEN p.role IN ('admin', 'instrutor') THEN 'AUTHORIZED'
        ELSE 'CHECK ROLE'
    END as access_status
FROM public.profiles p
WHERE p.email = 'frankwebber33@hotmail.com';

-- STEP 9: CHECK CONGREGATION ASSIGNMENT
-- Verify the user has a valid congregation assignment
SELECT 
    p.email,
    p.nome,
    c.nome as congregacao_nome,
    CASE 
        WHEN c.id IS NOT NULL THEN 'ASSIGNED'
        ELSE 'NEEDS CONGREGATION'
    END as congregation_status
FROM public.profiles p
LEFT JOIN public.congregacoes c ON p.congregacao_id = c.id
WHERE p.email = 'frankwebber33@hotmail.com';