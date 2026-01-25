@echo off
echo ====================================
echo Digital Twin Dakovo - Quick Setup
echo ====================================
echo.

echo Checking if Mapbox token exists...
if exist "frontend\.env" (
    echo [OK] .env file found
) else (
    echo [!] Creating .env file...
    copy "frontend\.env.example" "frontend\.env"
    echo.
    echo IMPORTANT: Add your Mapbox token to frontend\.env
    echo Get free token at: https://account.mapbox.com/
    echo.
    pause
)

echo.
echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo Servers starting...
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo ====================================
echo.
echo Press any key to exit this window...
pause > nul
