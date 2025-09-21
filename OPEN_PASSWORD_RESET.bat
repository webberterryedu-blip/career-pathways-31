@echo off
title Password Reset
color 0A

echo =====================================================
echo    PASSWORD RESET FOR frankwebber33@hotmail.com
echo =====================================================
echo.
echo Opening Supabase Dashboard...
echo.
echo Next steps:
echo 1. Find "frankwebber33@hotmail.com" in the user list
echo 2. Click the three dots menu next to the user
echo 3. Select "Reset Password"
echo 4. Set password to: Test1234!
echo 5. Use this password to log in to your app
echo.

timeout /t 3 /nobreak >nul

start "" "https://app.supabase.com/project/jbapewpuvfijrkhlbsid/auth/users"

echo.
echo Dashboard opened! Follow the steps above.
echo.
echo Press any key to exit...
pause >nul
exit