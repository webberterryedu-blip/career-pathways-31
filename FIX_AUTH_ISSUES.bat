@echo off
title Authentication Fix Tool
color 0A

echo =====================================================
echo    SISTEMA MINISTERIAL - AUTHENTICATION FIX TOOL
echo =====================================================
echo.
echo This tool will help you resolve authentication issues
echo.
echo Current user: frankwebber33@hotmail.com
echo Profile status: EXISTS AND CORRECT
echo Issue: Invalid login credentials (password problem)
echo.

:MENU
echo =====================================================
echo SELECT AN OPTION:
echo =====================================================
echo 1. Open Supabase Dashboard to Reset Password
echo 2. Test Authentication in Browser
echo 3. Clear Cache and Restart Development Server
echo 4. Create New Test User Instructions
echo 5. Show Detailed Troubleshooting Guide
echo 6. Exit
echo =====================================================
echo.

choice /C 123456 /M "Select an option"

if errorlevel 6 goto EXIT
if errorlevel 5 goto GUIDE
if errorlevel 4 goto NEW_USER
if errorlevel 3 goto CLEAR_CACHE
if errorlevel 2 goto TEST_BROWSER
if errorlevel 1 goto RESET_PASSWORD

:RESET_PASSWORD
echo.
echo Opening Supabase Dashboard...
echo.
echo Please:
echo 1. Go to https://app.supabase.com/project/jbapewpuvfijrkhlbsid
echo 2. Click "Authentication" ^> "Users"
echo 3. Find user: frankwebber33@hotmail.com
echo 4. Click the three dots menu ^> "Reset Password"
echo 5. Set a new password you'll remember
echo 6. Restart your server and try logging in
echo.
echo Press any key to open the URL in your browser...
pause >nul
start "" "https://app.supabase.com/project/jbapewpuvfijrkhlbsid"
goto MENU

:TEST_BROWSER
echo.
echo Opening authentication test in browser...
echo.
echo Press any key to open the test page...
pause >nul
start "" "TEST_AUTH_BROWSER.html"
goto MENU

:CLEAR_CACHE
echo.
echo Clearing cache and restarting development server...
echo.
echo This will:
echo 1. Kill processes on ports 8080 and 3001
echo 2. Clear npm cache
echo 3. Restart the development server
echo.
echo Press any key to continue...
pause >nul

echo Killing processes on ports 8080 and 3001...
taskkill /f /im node.exe 2>nul
netstat -ano | findstr :8080 | findstr LISTENING >nul && for /f "tokens=5" %a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %a 2>nul
netstat -ano | findstr :3001 | findstr LISTENING >nul && for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %a 2>nul

echo Clearing npm cache...
npm cache clean --force

echo Restarting development server...
echo.
echo To manually restart:
echo 1. Open a new terminal
echo 2. Navigate to your project directory
echo 3. Run: npm run dev:all
echo.
echo Press any key to continue...
pause >nul
goto MENU

:NEW_USER
echo.
echo Instructions to Create a New Test User:
echo ========================================
echo.
echo 1. Go to Supabase Dashboard:
echo    https://app.supabase.com/project/jbapewpuvfijrkhlbsid
echo.
echo 2. Click "Authentication" ^> "Users"
echo.
echo 3. Click "New User" button
echo.
echo 4. Fill in the form:
echo    Email: test@system.com
echo    Password: Test1234!
echo    Check "Email confirmed"
echo    Click "Create User"
echo.
echo 5. Create the profile by running this SQL in SQL Editor:
echo    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
echo    INSERT INTO profiles (user_id, email, nome, role, created_at, updated_at)
echo    SELECT id, 'test@system.com', 'Test User', 'instrutor', NOW(), NOW()
echo    FROM auth.users WHERE email = 'test@system.com';
echo    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
echo.
echo 6. Login with:
echo    Email: test@system.com
echo    Password: Test1234!
echo.
echo Press any key to continue...
pause >nul
goto MENU

:GUIDE
echo.
echo DETAILED TROUBLESHOOTING GUIDE:
echo ===============================
echo.
echo YOUR PROFILE IS CORRECT:
echo - user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
echo - email: frankwebber33@hotmail.com
echo - nome: Frank Webber
echo - role: instrutor
echo.
echo THE ISSUE IS WITH YOUR PASSWORD:
echo - You're using the wrong password for an existing account
echo - This is the most common cause of "Invalid login credentials"
echo.
echo SOLUTIONS (in order of recommendation):
echo 1. RESET YOUR PASSWORD IN SUPABASE DASHBOARD
echo    - Go to Authentication ^> Users
echo    - Find your user and reset password
echo.
echo 2. CREATE A NEW TEST USER
echo    - Create test@system.com with password Test1234!
echo.
echo 3. CLEAR CACHE AND RESTART
echo    - Kill processes, clear cache, restart server
echo.
echo Press any key to continue...
pause >nul
goto MENU

:EXIT
echo.
echo Thank you for using the Authentication Fix Tool!
echo.
echo If you continue to have issues, please:
echo 1. Contact your Supabase project administrator
echo 2. Verify your account status in the dashboard
echo 3. Check for any auth policies that might be blocking access
echo.
echo Press any key to exit...
pause >nul
exit