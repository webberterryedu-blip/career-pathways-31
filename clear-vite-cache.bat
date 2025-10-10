@echo off
echo Clearing Vite build cache...
echo.

REM Delete Vite cache
if exist node_modules\.vite (
    echo Removing node_modules\.vite...
    rmdir /s /q node_modules\.vite
    echo ✓ Vite cache cleared
) else (
    echo ℹ No Vite cache found
)

REM Delete build output
if exist dist (
    echo Removing dist folder...
    rmdir /s /q dist
    echo ✓ Build output cleared
) else (
    echo ℹ No dist folder found
)

echo.
echo ✅ Cache cleared successfully!
echo.
echo Next steps:
echo 1. Hard refresh your browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
echo 2. Open DevTools ^> Application ^> Clear storage ^> Clear site data
echo 3. Restart dev server: npm run dev
echo.
pause
