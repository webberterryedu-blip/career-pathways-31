-- =====================================================
-- SUPABASE FIX SCRIPT
-- =====================================================
-- This script fixes authentication and RLS issues for the career pathways app
-- Run this in the Supabase SQL Editor

-- 1. CREATE RLS POLICIES FOR PROFILES TABLE
-- First, enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO authenticated;

-- 2. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- (Only if you don't already have this)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'instrutor'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FIX EXISTING PROFILE USER_ID MISMATCH
-- This updates any existing profiles to ensure user_id matches auth.uid()
UPDATE profiles 
SET user_id = id 
WHERE user_id IS NULL OR user_id != id;

-- 4. VERIFY TABLE STRUCTURE
-- Make sure the profiles table has the correct structure
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'instrutor', 'estudante')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 5. INSERT TEST USER PROFILE (if needed)
-- Uncomment and modify as needed for testing
/*
INSERT INTO profiles (user_id, email, nome, role, created_at, updated_at)
VALUES (
  '1d112896-626d-4dc7-a758-0e5bec83fe6c',  -- Replace with actual user ID
  'frankwebber33@hotmail.com',
  'Frank Webber',
  'instrutor',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  updated_at = NOW();
*/

-- 6. VERIFY RLS STATUS
-- Check if RLS is enabled
SELECT tablename, relname, relrowsecurity 
FROM pg_class pc 
JOIN pg_namespace pn ON pc.relnamespace = pn.oid 
WHERE tablename = 'profiles' AND relrowsecurity = true;

-- 7. CHECK EXISTING POLICIES
-- Verify the policies we just created
SELECT policyname, tablename, permissive, roles, cmd 
FROM pg_policy pp 
JOIN pg_class pc ON pp.polrelid = pc.oid 
WHERE pc.relname = 'profiles';

-- END OF SCRIPT