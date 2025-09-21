-- ======================================================
-- VERIFY AUTHENTICATION FIX
-- ======================================================

-- Run this query after creating the profile to verify it exists
SELECT 
    user_id,
    email,
    nome,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE user_id = '1d112896-626d-4dc7-a758-0e5bec83fe6c';

-- If this query returns a row, your profile has been created successfully
-- and the "Invalid login credentials" error should be resolved after
-- restarting your development server.