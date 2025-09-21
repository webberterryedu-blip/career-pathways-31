# IMMEDIATE SOLUTION FOR AUTHENTICATION ERROR

## The Problem
You're getting "Invalid login credentials" because Supabase requires email confirmation by default, and your users haven't confirmed their emails.

## Quick Fix (Do This Now)

1. **Go to your Supabase Dashboard**:
   - Visit: https://app.supabase.com/project/jbapewpuvfijrkhlbsid
   - Sign in with your credentials

2. **Disable Email Confirmation**:
   - In the left sidebar, click "Authentication"
   - Click "Settings" tab
   - Find the toggle "Enable email confirmations"
   - Turn it **OFF**
   - Scroll down and click "Save"

3. **Test Again**:
   - Try to log in with your existing credentials
   - You should now be able to log in without email confirmation

## Alternative Solution: Create a New User
If the above doesn't work:

1. Go to the "Auth" page in your app
2. Click "Cadastro" (Sign Up)
3. Create a new user account
4. Try to log in with this new account

## For Development Only
This solution is fine for development. For production, you should:
- Turn email confirmation back ON
- Use proper email confirmation flows
- Test the full authentication flow

## Why This Happens
Supabase security model requires email confirmation by default to prevent unauthorized access. In development, this can be disabled for easier testing.

## Need More Help?
If you're still having issues after disabling email confirmation:
1. Check that your environment variables are correct
2. Verify your Supabase URL and ANON key in the [.env](file:///c:/Users/webbe/Documents/GitHub/career-pathways-31/.env) file
3. Restart your development server