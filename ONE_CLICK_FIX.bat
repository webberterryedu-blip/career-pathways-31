@echo off
echo ======================================================
echo 🚨 ONE-CLICK IMMEDIATE FIX 🚨
echo ======================================================
echo.
echo OPENING SUPABASE DASHBOARD...
echo.
echo AFTER THE DASHBOARD OPENS:
echo 1. Sign in with your Supabase credentials
echo 2. Go to Table Editor ^> profiles ^> Insert
echo 3. Enter exactly:
echo    user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
echo    email: frankwebber33@hotmail.com
echo    nome: Frank Webber
echo    role: instrutor
echo 4. Click Save
echo 5. Restart your server and login
echo.
echo This will fix the "Invalid login credentials" error!
echo.
start "" "https://app.supabase.com/project/jbapewpuvfijrkhlbsid"
timeout /t 3 >nul
notepad "IMMEDIATE_AUTH_FIX.txt"