@echo off
REM Debug wrapper for run_export_geojson.bat
REM Use this when running manually so the console stays open after completion.
cd /d "%~dp0"
call "%~dp0run_export_geojson.bat"
set "EXITCODE=%ERRORLEVEL%"
echo.
echo ============================================================
echo run_export_geojson.bat exited with code %EXITCODE%
echo Log file: "%~dp0export_geojson_fresh.log"
echo.
if exist "%~dp0export_geojson_fresh.log" type "%~dp0export_geojson_fresh.log"
echo.
pause
exit /b %EXITCODE%
