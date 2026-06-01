@echo off
setlocal EnableExtensions

cd /d "%~dp0"

if /I "%~1"=="--inner" (
  shift /1
  goto run
)
if "%~1"=="--check" goto check

cmd /k ""%~f0" --inner"
exit /b %ERRORLEVEL%

:run
:check
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  if "%~1"=="--check" exit /b 1
  goto failed
)

where bun >nul 2>nul
if errorlevel 1 (
  echo Bun was not found in PATH. Install Bun first: https://bun.sh
  if "%~1"=="--check" exit /b 1
  goto failed
)

where opencode >nul 2>nul
if errorlevel 1 (
  echo OpenCode CLI was not found in PATH. Install it before starting OpenCode Manager.
  if "%~1"=="--check" exit /b 1
  goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
  where corepack >nul 2>nul
  if errorlevel 1 (
    echo pnpm was not found, and corepack is unavailable. Run: npm install -g pnpm
    if "%~1"=="--check" exit /b 1
    goto failed
  )
  set "PNPM=corepack pnpm"
) else (
  set "PNPM=pnpm"
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-local-env.ps1"
if errorlevel 1 (
  if "%~1"=="--check" exit /b 1
  goto failed
)

set "PATH=%~dp0scripts\.bin;%PATH%"

if "%~1"=="--check" (
  echo Local prerequisites look ready.
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-local-instances.ps1" -Root "%CD%"
if errorlevel 1 goto failed

if not exist "workspace\repos" mkdir "workspace\repos"
if not exist "workspace\config" mkdir "workspace\config"

call %PNPM% install
if errorlevel 1 goto failed

call %PNPM% --filter backend build
if errorlevel 1 goto failed

call %PNPM% --filter frontend build
if errorlevel 1 goto failed

echo.
echo OpenCode Manager is starting on http://localhost:5003
echo Press Ctrl+C in this window to stop it.
echo.

set "NODE_ENV=production"
bun run backend/dist/index.js
set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo OpenCode Manager stopped with exit code %EXIT_CODE%.
echo.
pause
exit /b %EXIT_CODE%

:failed
echo.
echo Startup failed. See the messages above.
echo.
pause
exit /b 1
