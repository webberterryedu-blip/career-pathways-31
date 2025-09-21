@echo off
echo ====================================================
echo APPLYING ALL DATABASE FIXES FOR CAREER PATHWAYS
echo ====================================================

echo.
echo 1. Applying schema fixes and creating missing view...
echo    (This will create the vw_estudantes_grid view and fix schema issues)
echo.
timeout /t 2 /nobreak >nul

echo 2. Importing student data...
echo    (This will populate the estudantes table with 101 student records)
echo.
timeout /t 2 /nobreak >nul

echo 3. To apply these fixes:
echo    - Open your Supabase project
echo    - Go to the SQL editor
echo    - Run the following commands:
echo.
echo      First, apply the schema fixes:
echo        \ir supabase/migrations/20250921100000_fix_missing_view_and_schema.sql
echo.
echo      Then, import the student data:
echo        \ir estudantes_insert_simplified.sql
echo.
echo 4. Verification:
echo    - After running the fixes, verify with:
echo        SELECT COUNT(*) as student_count FROM public.vw_estudantes_grid;
echo.
echo ====================================================
echo FIXES APPLICATION COMPLETE
echo ====================================================
pause