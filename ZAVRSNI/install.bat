@echo off
echo ====================================
echo Digital Twin Dakovo - Setup
echo ====================================
echo.

echo [1/3] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [2/3] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo [3/3] Setup complete!
echo.
echo ====================================
echo Next steps:
echo 1. Create .env files if needed (see MAPBOX_SETUP.md)
echo 2. Run 'start.bat' to launch the application
echo ====================================
echo.

cd ..
pause
