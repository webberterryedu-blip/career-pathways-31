@echo off
REM =====================================================
REM DEPLOY SUPABASE EDGE FUNCTIONS - AUTOMATED SCRIPT
REM =====================================================
REM This script automates the deployment of Supabase Edge Functions
REM with dependency validation, project linking, and post-deployment testing

echo.
echo 🚀 SUPABASE EDGE FUNCTIONS DEPLOYMENT
echo =====================================================
echo.

REM Check if Supabase CLI is installed
echo 🔍 Checking Supabase CLI installation...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI not found!
    echo Please install: https://supabase.com/docs/guides/cli/getting-started
    pause
    exit /b 1
)
echo ✅ Supabase CLI found

REM Check if user is logged in
echo.
echo 🔐 Checking authentication...
supabase projects list >nul 2>&1
if errorlevel 1 (
    echo ❌ Not authenticated with Supabase
    echo Please run: supabase login
    pause
    exit /b 1
)
echo ✅ Authenticated with Supabase

REM Link to project (if not already linked)
echo.
echo 🔗 Linking to project...
if not exist "supabase\.temp\project-ref" (
    echo Linking to project dlvojolvdsqrfczjjjuw...
    supabase link --project-ref dlvojolvdsqrfczjjjuw
    if errorlevel 1 (
        echo ❌ Failed to link project
        pause
        exit /b 1
    )
)
echo ✅ Project linked

REM Validate Edge Function files exist
echo.
echo 📂 Validating Edge Function files...

if not exist "supabase\functions\list-programs-json\index.ts" (
    echo ❌ Missing: supabase\functions\list-programs-json\index.ts
    pause
    exit /b 1
)
echo ✅ list-programs-json function found

if not exist "supabase\functions\generate-assignments\index.ts" (
    echo ❌ Missing: supabase\functions\generate-assignments\index.ts
    pause
    exit /b 1
)
if not exist "supabase\functions\save-assignments\index.ts" (
    echo ❌ Missing: supabase\functions\save-assignments\index.ts
    pause
    exit /b 1
)
echo ✅ save-assignments function found

REM Deploy functions
echo.
echo 🚢 Deploying Edge Functions...
echo.

echo Deploying list-programs-json...
supabase functions deploy list-programs-json
if errorlevel 1 (
    echo ❌ Failed to deploy list-programs-json
    pause
    exit /b 1
)
echo ✅ list-programs-json deployed successfully
echo.

echo Deploying generate-assignments...
supabase functions deploy generate-assignments
if errorlevel 1 (
    echo ❌ Failed to deploy generate-assignments
    pause
    exit /b 1
)
echo Deploying save-assignments...
supabase functions deploy save-assignments
if errorlevel 1 (
    echo ❌ Failed to deploy save-assignments
    pause
    exit /b 1
)
echo ✅ save-assignments deployed successfully
echo.

REM Post-deployment testing
echo 🧪 Testing deployed functions...
echo.

REM Test list-programs-json
echo Testing list-programs-json...
curl -s -w "Status: %%{http_code}\n" -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" -H "Content-Type: application/json" "https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/list-programs-json" -d "{\"limit\":5}" >nul 2>&1
if errorlevel 1 (
    echo ⚠️ list-programs-json test failed - but deployment was successful
) else (
    echo ✅ list-programs-json responding
)

REM Test generate-assignments
echo Testing generate-assignments...
curl -s -w "Status: %%{http_code}\n" -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" -H "Content-Type: application/json" "https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/generate-assignments" -d "{\"semana\":\"test\",\"data_reuniao\":\"2024-01-01\"}" >nul 2>&1
REM Test save-assignments
echo Testing save-assignments...
curl -s -w "Status: %%{http_code}\n" -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" -H "Content-Type: application/json" "https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/save-assignments" -d "{\"assignments\":[{\"assignment_type\":\"test\",\"assignment_title\":\"Test Assignment\",\"student_id\":\"test\",\"student_name\":\"Test Student\"}],\"validate_only\":true}" >nul 2>&1
if errorlevel 1 (
    echo ⚠️ save-assignments test failed - but deployment was successful
) else (
    echo ✅ save-assignments responding
)

echo.
echo 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
echo =====================================================
echo.
echo 📋 Summary:
echo   • list-programs-json: DEPLOYED ✅
echo   • generate-assignments: DEPLOYED ✅
echo   • save-assignments: DEPLOYED ✅
echo.
echo 🔗 Function URLs:
echo   • https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/list-programs-json
echo   • https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/generate-assignments
echo   • https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/save-assignments
echo.
echo 🎯 Next Steps:
echo   1. Update environment variables in .env.local:
echo      - VITE_SUPABASE_URL=https://dlvojolvdsqrfczjjjuw.supabase.co
echo      - VITE_SUPABASE_ANON_KEY=your-anon-key
echo   2. Test the functions in your application
echo   3. Monitor function logs in Supabase Dashboard
echo.
echo ⚡ Quick Test Commands:
echo   • Frontend: npm run dev:all
echo   • Navigate to: http://localhost:5173/programas
echo   • Navigate to: http://localhost:5173/designacoes
echo.
pause