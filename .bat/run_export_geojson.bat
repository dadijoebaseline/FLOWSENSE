@echo off
REM Batch file to run export_geojson_fresh.py using Python with persistent logging
cd /d "%~dp0"
setlocal enabledelayedexpansion
set "LOGFILE=%~dp0export_geojson_fresh.log"
set "SOURCE_DIR=%~dp0"
set "PYFILE=%SOURCE_DIR%export_geojson_fresh.py"
if /i "!SOURCE_DIR:~0,2!"=="\\" (
    set "TEMP_DIR=%TEMP%\run_export_geojson"
    mkdir "!TEMP_DIR!" 2>nul
    copy /y "!PYFILE!" "!TEMP_DIR!\" >nul 2>nul
    set "PYFILE=!TEMP_DIR!\export_geojson_fresh.py"
)
echo [%DATE% %TIME%] Starting export_geojson_fresh.py > "%LOGFILE%"
if exist "%~dp0export_geojson_fresh.py" (
    python "!PYFILE!"
    set "EXITCODE=!ERRORLEVEL!"
    if !EXITCODE! neq 0 (
        echo [%DATE% %TIME%] [ERROR] export_geojson_fresh.py failed with exit code !EXITCODE! >> "%LOGFILE%"
        endlocal
        echo.
        echo Press any key to close this window after viewing logs...
        pause >nul
        exit /b !EXITCODE!
    )
    echo [%DATE% %TIME%] Completed successfully with exit code !EXITCODE! >> "%LOGFILE%"
) else (
    echo [%DATE% %TIME%] [ERROR] export_geojson_fresh.py not found in %~dp0 >> "%LOGFILE%"
    endlocal
    echo.
    echo Press any key to close this window after viewing logs...
    pause >nul
    exit /b 1
)
endlocal
echo.
echo Press any key to close this window after viewing logs...
pause >nul
exit /b 0
