@echo off
echo Deploying Treasures From God's Word Assignment Function...

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Supabase CLI not found. Please install it first.
    echo Run: npm install -g @supabase/cli
    exit /b 1
)

REM Deploy the function
echo Deploying generate-treasures-assignments function...
supabase functions deploy generate-treasures-assignments

if %errorlevel% equ 0 (
    echo.
    echo ✅ Treasures From God's Word Assignment Function deployed successfully!
    echo.
    echo You can now use it by calling:
    echo POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-treasures-assignments
    echo.
    echo With headers:
    echo Authorization: Bearer YOUR_ANON_KEY
    echo Content-Type: application/json
    echo.
    echo And body:
    echo {
    echo   "semana": "2024-12-09",
    echo   "data_reuniao": "2024-12-09"
    echo }
) else (
    echo.
    echo ❌ Deployment failed. Check the error above.
)

pause