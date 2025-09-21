console.log(`
📋 PROFILE DIAGNOSTIC CHECK 📋

Based on the user information you provided, here's how to check if there's a profile issue:

USER INFORMATION:
================
Email: frankwebber33@hotmail.com
User ID: 1d112896-626d-4dc7-a758-0e5bec83fe6c

PROFILE DIAGNOSTIC STEPS:
========================

1. CHECK IF PROFILE EXISTS:
   - Go to Supabase Dashboard → Table Editor → profiles
   - Look for a record with email: frankwebber33@hotmail.com

2. CHECK PROFILE user_id FIELD:
   - If a profile exists, check the user_id field
   - It MUST exactly match: 1d112896-626d-4dc7-a758-0e5bec83fe6c
   - Any mismatch will cause RLS policy violations

3. CREATE PROFILE IF MISSING:
   - If no profile exists, create one with these exact values:
     * user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
     * email: frankwebber33@hotmail.com
     * nome: Frank Webber
     * role: instrutor
     * created_at: (current timestamp)
     * updated_at: (current timestamp)

4. FIX PROFILE IF user_id MISMATCH:
   - If profile exists but user_id doesn't match:
     * Click on the profile record
     * Edit the user_id field to: 1d112896-626d-4dc7-a758-0e5bec83fe6c
     * Save changes

5. TEST WITH NEW USER (Recommended):
   - Go to Supabase Dashboard → Authentication → Users
   - Click "New User"
   - Enter:
     * Email: test@example.com
     * Password: Test123456!
   - Check "Email confirmed"
   - Click "Save"
   - This user will automatically get a profile created

COMMON RLS ERROR:
================
If you see "406 Policy violation" errors, it's definitely a profile user_id mismatch.

QUICK FIX:
==========
1. Create a new test user in Supabase Dashboard
2. Make sure "Email confirmed" is checked
3. Try logging in with test@example.com / Test123456!

This bypasses any existing profile issues and gives you a clean user to test with.
`);