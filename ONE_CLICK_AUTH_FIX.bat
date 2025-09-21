@echo off
title One-Click Auth Fix
color 0A

echo =====================================================
echo    SISTEMA MINISTERIAL - ONE-CLICK AUTH FIX
echo =====================================================
echo.
echo Current Issue: Invalid login credentials
echo User: frankwebber33@hotmail.com
echo.
echo This will open the Supabase dashboard where you can
echo reset your password immediately.
echo.

echo Opening Supabase Dashboard...
echo.
echo NEXT STEPS (follow in your browser):
echo 1. Go to Authentication ^> Users
echo 2. Find frankwebber33@hotmail.com
echo 3. Click the three dots menu
echo 4. Select "Reset Password"
echo 5. Set a new password
echo 6. Use that password to log in to your app
echo.

timeout /t 3 /nobreak >nul

start "" "https://app.supabase.com/project/jbapewpuvfijrkhlbsid"

echo.
echo Dashboard opened in your browser!
echo.
echo Follow the steps above to reset your password.
echo.
echo After resetting your password:
echo 1. Close this window
echo 2. Restart your development server
echo 3. Try logging in with the new password
echo.
echo Press any key to exit...
pause >nul
exit