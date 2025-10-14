@echo off
echo =========================================
echo   Restarting Backend Server
echo =========================================
echo.

echo [1/3] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting backend server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm run dev"

echo.
echo [3/3] Testing API...
timeout /t 5 /nobreak >nul
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/comments/author/1'; Write-Host '✅ API Response:' -ForegroundColor Green; $response | ConvertTo-Json -Depth 3 } catch { Write-Host '❌ API not responding yet. Please wait a few seconds and try again.' -ForegroundColor Red }"

echo.
echo =========================================
echo   Backend server should now be running
echo   Check the new window for server logs
echo =========================================
echo.
echo Next steps:
echo 1. Press Ctrl+Shift+R in your browser
echo 2. Go to Dashboard
echo 3. Check Commentaires tab
echo.
pause
