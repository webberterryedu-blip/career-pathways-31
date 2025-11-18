-- Fix existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Fix profile roles (change from 'user' to 'instrutor')
UPDATE profiles 
SET role = 'instrutor'
WHERE role IS NULL OR role = 'user';