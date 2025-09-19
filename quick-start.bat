@echo off
echo 🚀 Sistema Ministerial - Início Rápido
echo =====================================

echo 🔧 Limpando portas...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /PID %%a /F >nul 2>&1

echo ✅ Portas limpas!

echo 🎯 Iniciando sistema...
npm run dev:all

pause