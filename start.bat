@echo off
title AcademIQ - AI Academic Behavior Profiling System
color 0A

echo ================================================
echo   AcademIQ - AI Academic Behavior Profiling
echo ================================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ first.
    pause & exit
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ first.
    pause & exit
)

:: Check MongoDB
echo [INFO] Make sure MongoDB is running on port 27017
echo.

:: Train ML model if not exists
if not exist "backend\ml\model.pkl" (
    echo [INFO] Training ML model for the first time...
    cd backend
    python ml\train_model.py
    cd ..
    echo [OK] Model trained!
    echo.
)

:: Start Backend in new window
echo [INFO] Starting Flask Backend on port 5000...
start "AcademIQ Backend" cmd /k "cd /d %~dp0backend && python app.py"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

:: Start Frontend in new window
echo [INFO] Starting React Frontend on port 5173...
start "AcademIQ Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo   Both servers are starting!
echo ================================================
echo.
echo   Frontend:   http://localhost:5173
echo   Backend:    http://localhost:5000
echo   API Health: http://localhost:5000/api/health
echo.
echo   Demo Credentials:
echo   Admin:    admin@academic.com   / admin123
echo   Faculty:  faculty@academic.com / faculty123
echo   Student:  arjun@student.com    / student123
echo.
echo   Close the two terminal windows to stop servers.
echo ================================================
echo.
start http://localhost:5173
pause
