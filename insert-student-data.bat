@echo off
echo Inserindo dados dos estudantes no banco de dados Supabase...
echo.

cd /d "%~dp0\backend"
node run-insert-student-data.js

echo.
echo Processo concluído.
pause