-- ======================================================
-- VERIFY PROFILE FIX
-- ======================================================

-- Run this query after running the fix to verify everything is correct
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

-- This should return exactly one row with:
-- user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
-- email: frankwebber33@hotmail.com
-- nome: Frank Webber
-- role: instrutor

-- If this returns a row with correct data, your authentication issue is solved!