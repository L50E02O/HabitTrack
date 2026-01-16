@echo off
echo ========================================
echo   HabitTrack - Iniciar Servidores
echo ========================================
echo.
echo Este script iniciara dos terminales:
echo   1. Servidor Backend (Puerto 3001)
echo   2. Servidor Frontend (Puerto 5173)
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo [1/2] Iniciando servidor backend...
start "HabitTrack Backend" cmd /k "cd /d %~dp0 && npm run dev:api"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando servidor frontend...
start "HabitTrack Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Servidores iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Abre tu navegador en: http://localhost:5173
echo.
echo Para detener los servidores, cierra las ventanas de terminal.
echo.
pause
