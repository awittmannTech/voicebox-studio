@echo off
echo Starting Voicebox Development Environment
echo.
echo This will open two terminal windows:
echo   1. Backend server (Python FastAPI)
echo   2. Frontend app (Tauri)
echo.
echo Press any key to continue...
pause > nul

start "Voicebox Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn main:app --reload --port 17493"
timeout /t 3 > nul
start "Voicebox Frontend" cmd /k "cd /d %~dp0 && bun run dev"

echo.
echo Development servers starting...
echo Backend: http://localhost:17493
echo Frontend: Tauri app will launch automatically
echo.
