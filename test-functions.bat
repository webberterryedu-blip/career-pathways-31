@echo off
echo 🧪 Testing Sistema Ministerial Edge Functions...
echo.

REM Set environment variables (replace with your actual keys)
if "%VITE_SUPABASE_ANON_KEY%"=="" (
    echo ❌ Error: VITE_SUPABASE_ANON_KEY environment variable not set
    echo Please set it in your .env file or system environment
    pause
    exit /b 1
)

set "SUPABASE_URL=https://dlvojolvdsqrfczjjjuw.supabase.co"
set "FUNCTIONS_URL=%SUPABASE_URL%/functions/v1"

echo ✅ Environment configured
echo   Supabase URL: %SUPABASE_URL%
echo   Using ANON_KEY: %VITE_SUPABASE_ANON_KEY:~0,10%...
echo.

echo 🔍 Testing Edge Functions...
echo.

REM Test 1: list-programs-json
echo 1️⃣ Testing list-programs-json...
curl -s -w "HTTP Status: %%{http_code}\n" ^
  "%FUNCTIONS_URL%/list-programs-json" ^
  -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" ^
  -H "Content-Type: application/json"

echo.
echo.

REM Test 2: generate-assignments
echo 2️⃣ Testing generate-assignments...
curl -s -w "HTTP Status: %%{http_code}\n" ^
  "%FUNCTIONS_URL%/generate-assignments" ^
  -X POST ^
  -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"program_id\":\"test-2024-01\",\"parts\":[{\"id\":\"test-part-1\",\"title\":\"Leitura da Bíblia\",\"time\":4,\"type\":\"reading\",\"participants\":1,\"gender_restriction\":\"brother\"}]}"

echo.
echo.

REM Test 3: save-assignments
echo 3️⃣ Testing save-assignments...
curl -s -w "HTTP Status: %%{http_code}\n" ^
  "%FUNCTIONS_URL%/save-assignments" ^
  -X POST ^
  -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"assignments\":[{\"part_id\":\"test-part-1\",\"part_title\":\"Test Assignment\",\"student_id\":1,\"student_name\":\"Test Student\"}],\"program_id\":\"test-2024-01\",\"week_date\":\"2024-01-01\"}"

echo.
echo.

echo 🌐 Testing Frontend Connection...
echo Checking if frontend can reach localhost:8080...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" "http://localhost:8080" 2>nul
if errorlevel 1 (
    echo ❌ Frontend not accessible on localhost:8080
    echo Make sure to run: npm run dev:all
) else (
    echo ✅ Frontend accessible
)

echo.
echo 🔧 Testing Backend API...
echo Checking if backend can reach localhost:3001...
curl -s -o nul -w "Backend Status: %%{http_code}\n" "http://localhost:3001/api/status" 2>nul
if errorlevel 1 (
    echo ❌ Backend not accessible on localhost:3001
    echo Make sure to run: npm run dev:all
) else (
    echo ✅ Backend accessible
)

echo.
echo 📊 Test Results Summary:
echo   • Edge Functions should return HTTP 200 with JSON data
echo   • Frontend should be accessible on port 8080
echo   • Backend should be accessible on port 3001
echo.
echo 🎯 Next Steps:
echo   1. If functions return 404: Run deploy-functions.bat
echo   2. If functions return 401: Check your VITE_SUPABASE_ANON_KEY
echo   3. If functions return 500: Check Supabase logs in dashboard
echo   4. Test the complete flow at http://localhost:8080/designacoes
echo.
pause