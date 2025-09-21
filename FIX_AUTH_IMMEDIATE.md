# IMMEDIATE FIX FOR AUTHENTICATION ISSUES

## The Problem
You're experiencing two related issues:
1. "Invalid login credentials" - Email confirmation required
2. 406 error - RLS (Row Level Security) policy issue

## Immediate Solution

### Step 1: Fix Email Confirmation (Most Important)
1. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com/project/jbapewpuvfijrkhlbsid
   - Sign in with your credentials

2. **Disable Email Confirmation**:
   - In the left sidebar, click "Authentication"
   - Click "Settings" tab
   - Find the toggle "Enable email confirmations"
   - Turn it **OFF**
   - Scroll down and click "Save"

### Step 2: Test Authentication
1. Go back to your application
2. Try to log in with your existing credentials
3. You should now be able to log in without email confirmation

### Step 3: If Still Not Working
1. In your app, click "Diagnosticar Problemas" in the development notice
2. This will show you exactly what's happening
3. Follow the specific recommendations

## Why This Happens
- **Email Confirmation**: Supabase security feature that requires users to confirm their email
- **RLS Error**: Row Level Security policies prevent users from accessing data they don't own

## For Production
Remember to re-enable email confirmation when moving to production for security.

## Quick Access
You can open the Supabase dashboard directly from your app using the "Abrir Supabase Dashboard" button in the development notice.