@echo off
SETLOCAL
REM Deploy this project to Vercel using the Vercel CLI.
REM Run this from the current working directory or double-click this file.

echo Current working directory: %CD%
set "SEARCH_DIR=%~dp0"
if "%SEARCH_DIR:~-1%"=="\" set "SEARCH_DIR=%SEARCH_DIR:~0,-1%"
:set_root
if exist "%SEARCH_DIR%\package.json" goto found_root
set "PREV_DIR=%SEARCH_DIR%"
for %%I in ("%SEARCH_DIR%\..") do set "SEARCH_DIR=%%~fI"
if /I "%SEARCH_DIR%"=="%PREV_DIR%" goto no_project_root
goto set_root

:found_root
cd /d "%SEARCH_DIR%"
echo Using project directory: %CD%
echo Deploying to Vercel...

npx vercel --prod --confirm
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% NEQ 0 (
  echo.
  echo Deployment failed with exit code %EXIT_CODE%.
  echo Make sure Vercel CLI is installed and you are logged in:
  echo   npm install -g vercel
  echo   npx vercel login
  echo If this is the first deployment, you may also need to link the project:
  echo   npx vercel link
  echo.
  pause
  exit /b %EXIT_CODE%
)
echo.
echo Deployment completed successfully.
pause
ENDLOCAL

:no_project_root
echo.
echo No package.json found in the current directory or any parent folder.
echo Please run this script from within your project directory.
pause
exit /b 1
