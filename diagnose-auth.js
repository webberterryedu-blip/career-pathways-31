console.log(`
🔧 AUTHENTICATION DIAGNOSIS TOOL 🔧

Based on the information you've provided, here's how to diagnose and fix your authentication issue:

USER INFORMATION:
================
Email: frankwebber33@hotmail.com
User ID: 1d112896-626d-4dc7-a758-0e5bec83fe6c
Status: Confirmed (2025-09-21 17:18:10)
Last Sign In: 2025-09-21 17:18:10

DIAGNOSIS STEPS:
================

1. CHECK PASSWORD:
   - Make sure you're using the correct password
   - Try resetting the password:
     * Go to Supabase Dashboard → Authentication → Users
     * Find frankwebber33@hotmail.com
     * Click on the user and select "Reset Password"

2. CHECK PROFILE EXISTENCE:
   - Go to Supabase Dashboard → Table Editor → profiles
   - Look for a profile with email: frankwebber33@hotmail.com
   - If it doesn't exist, create one with:
     * user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
     * email: frankwebber33@hotmail.com
     * nome: Frank Webber
     * role: instrutor

3. CHECK PROFILE user_id MATCH:
   - If the profile exists, verify the user_id field
   - It MUST match exactly: 1d112896-626d-4dc7-a758-0e5bec83fe6c
   - If it doesn't match, update it

4. CREATE NEW TEST USER (Recommended):
   - Go to Supabase Dashboard → Authentication → Users
   - Click "New User"
   - Enter:
     * Email: test@example.com
     * Password: Test123456!
   - Check "Email confirmed"
   - Click "Save"
   - Try logging in with these credentials

5. CLEAR BROWSER DATA:
   - Press F12 to open Developer Tools
   - Go to Application tab
   - Expand Local Storage and Session Storage
   - Right-click on localhost entries and select "Clear"
   - Refresh the page

6. CHECK EMAIL CONFIRMATION SETTING:
   - Go to Supabase Dashboard → Authentication → Settings
   - Ensure "Enable email confirmations" is OFF for development
   - Click "Save"

IMMEDIATE TEST CREDENTIALS:
=========================
Email: test@example.com
Password: Test123456!

If you continue to have issues, please share:
1. The exact error message you see
2. Whether you can see the user in the profiles table
3. Whether the user_id in the profile matches the auth user ID
`);