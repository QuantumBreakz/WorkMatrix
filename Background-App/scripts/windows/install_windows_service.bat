@echo off
setlocal enabledelayedexpansion

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this script as Administrator
    pause
    exit /b 1
)

:: Set paths
set "CURRENT_DIR=%~dp0"
set "NSSM_PATH=%CURRENT_DIR%nssm.exe"
set "SERVICE_NAME=WorkMatrix"
set "SERVICE_DISPLAY_NAME=WorkMatrix Background Service"
set "SERVICE_DESCRIPTION=WorkMatrix activity tracking and screenshot service"

:: Download NSSM if not present
if not exist "%NSSM_PATH%" (
    echo Downloading NSSM...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'}"
    powershell -Command "& {Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm_temp' -Force}"
    copy "nssm_temp\nssm-2.24\win64\nssm.exe" "%NSSM_PATH%"
    rmdir /s /q "nssm_temp"
    del "nssm.zip"
)

:: Create the service
echo Installing WorkMatrix service...
"%NSSM_PATH%" install "%SERVICE_NAME%" "%CURRENT_DIR%start_workmatrix.bat"
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%SERVICE_DISPLAY_NAME%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "%SERVICE_DESCRIPTION%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%CURRENT_DIR%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%CURRENT_DIR%data\logs\service.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%CURRENT_DIR%data\logs\service_error.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateOnline 1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateSeconds 86400
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateBytes 10485760

:: Start the service
echo Starting WorkMatrix service...
net start "%SERVICE_NAME%"

echo.
echo WorkMatrix service has been installed and started.
echo You can manage it through Windows Services (services.msc)
echo.
pause 