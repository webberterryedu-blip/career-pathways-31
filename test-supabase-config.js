console.log(`
🔐 SUPABASE CONFIGURATION VERIFICATION 🔐

This script verifies that your Supabase configuration is correct.

CONFIGURATION CHECKS:
====================

1. FRONTEND .env FILE:
   VITE_SUPABASE_URL: https://jbapewpuvfijrkhlbsid.supabase.co
   VITE_SUPABASE_ANON_KEY: *** PROVIDED ***
   VITE_SITE_URL: http://localhost:8080

2. BACKEND .env FILE:
   SUPABASE_URL: https://jbapewpuvfijrkhlbsid.supabase.co
   SUPABASE_SERVICE_ROLE_KEY: *** PROVIDED ***
   CORS_ORIGIN: http://localhost:8080

3. SUPABASE DASHBOARD SETTINGS:
   - Email confirmation: SHOULD BE DISABLED
   - Site URL: http://localhost:8080
   - Redirect URLs: http://localhost:8080/**

REQUIRED ACTIONS:
================

1. DISABLE EMAIL CONFIRMATION:
   - Go to Supabase Dashboard → Authentication → Settings
   - Turn OFF "Enable email confirmations"
   - Click "Save"

2. APPLY SQL FIXES:
   - Run supabase-fix.sql in Supabase SQL Editor
   - This fixes RLS policies and profile issues

3. RESTART DEVELOPMENT SERVERS:
   - Stop all servers (Ctrl+C)
   - Run: npm run dev:all

TEST CREDENTIALS:
================
After applying fixes, test with:
- Email: frankwebber33@hotmail.com
- Password: (your actual password)

Or create a new test user:
- Email: test@example.com
- Password: Test123456!

TROUBLESHOOTING:
===============

If you still get "Invalid login credentials":
1. Reset password in Supabase Dashboard
2. Verify user is confirmed
3. Check browser console for detailed errors

If you get RLS policy errors (406):
1. Verify SQL script ran successfully
2. Check that profiles have correct user_id values
3. Ensure you're using the right credentials

If profiles aren't loading:
1. Check that the automatic profile creation trigger is working
2. Verify the service role key is correctly configured
3. Look for any console errors in the browser or server logs
`);