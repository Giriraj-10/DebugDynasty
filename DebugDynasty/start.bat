@echo off
title IntelliCare Launcher

echo.
echo  ================================================
echo    IntelliCare ^| Backend + Frontend Launcher
echo  ================================================
echo.

:: ── Kill any process already using port 8080 (backend) ──────────────────────
echo  Checking port 8080 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: ── Kill any process already using port 5173 (frontend) ─────────────────────
echo  Checking port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  Ports cleared. Launching servers...
echo.

:: ── Start Spring Boot backend in a new window ────────────────────────────────
start "IntelliCare Backend :8080" cmd /k "cd /d %~dp0backend && echo [Backend] Starting Spring Boot on :8080... && mvn spring-boot:run"

:: Small delay
timeout /t 2 /nobreak >nul

:: ── Start Vite frontend in a new window ──────────────────────────────────────
start "IntelliCare Frontend :5173" cmd /k "cd /d %~dp0frontend && echo [Frontend] Starting Vite dev server on :5173... && npm run dev"

echo  Both servers launched in separate windows.
echo.
echo  Frontend  : http://localhost:5173
echo  Backend   : http://localhost:8080
echo  H2 Console: http://localhost:8080/h2-console
echo.
echo  Close the individual windows to stop each server.
echo.
pause
