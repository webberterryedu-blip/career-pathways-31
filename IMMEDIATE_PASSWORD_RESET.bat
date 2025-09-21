@echo off
title IMMEDIATE PASSWORD RESET
color 0C

echo =====================================================
echo    IMMEDIATE PASSWORD RESET SOLUTION
echo =====================================================
echo.
echo YOUR ISSUE: Invalid login credentials
echo YOUR EMAIL: frankwebber33@hotmail.com
echo YOUR PROFILE: EXISTS AND IS CORRECT
echo.
echo ROOT CAUSE: You're using the WRONG PASSWORD
echo.
echo SOLUTION: Reset your password NOW
echo.

echo OPENING SUPABASE DASHBOARD...
echo.
echo Follow these steps in your browser:
echo 1. Go to Authentication ^> Users
echo 2. Find frankwebber33@hotmail.com
echo 3. Click the THREE DOTS menu
echo 4. Select "Reset Password"
echo 5. Set a new password
echo 6. Use that password to log in
echo.

timeout /t 2 /nobreak >nul

start "" "https://app.supabase.com/project/jbapewpuvfijrkhlbsid/auth/users"

echo.
echo IF THE ABOVE DOESN'T WORK:
echo.
echo 1. Create a new test user:
echo    - Email: test@system.com
echo    - Password: Test1234!
echo    - Check "Email confirmed"
echo.
echo 2. Run this SQL in Supabase SQL Editor:
echo    INSERT INTO profiles (user_id, email, nome, role, created_at, updated_at)
echo    SELECT id, 'test@system.com', 'Test User', 'instrutor', NOW(), NOW()
echo    FROM auth.users WHERE email = 'test@system.com';
echo.
echo Press any key to exit...
pause >nul
exit