@echo off
setlocal enabledelayedexpansion

:: Colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:: Function to display logo
call :display_logo

:: Function to print status messages
call :print_status "Starting WorkMatrix uninstallation..."

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    call :print_error "Please run this script as Administrator"
    pause
    exit /b 1
)

:: Set paths
set "CURRENT_DIR=%~dp0"
set "NSSM_PATH=%CURRENT_DIR%nssm.exe"
set "SERVICE_NAME=WorkMatrix"

:: Stop and remove the service
call :print_status "Stopping WorkMatrix service..."
net stop "%SERVICE_NAME%" 2>nul
if errorlevel 1 (
    call :print_warning "Service was not running"
)

call :print_status "Removing WorkMatrix service..."
"%NSSM_PATH%" remove "%SERVICE_NAME%" confirm
if errorlevel 1 (
    call :print_error "Failed to remove service"
    exit /b 1
)

:: Clean up files
call :print_status "Cleaning up files..."
if exist "start_workmatrix.bat" del /f /q "start_workmatrix.bat"
if exist "data\logs\service.log" del /f /q "data\logs\service.log"
if exist "data\logs\service_error.log" del /f /q "data\logs\service_error.log"

call :print_status "Uninstallation completed successfully!"
pause
exit /b 0

:display_logo
echo %BLUE%
echo ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
echo ██║    ██║██╔═══██╗██╔══██╗██║  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
echo ██║ █╗ ██║██║   ██║██████╔╝███████║██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
echo ██║███╗██║██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
echo ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
echo  ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
echo %NC%
exit /b 0

:print_status
echo %GREEN%[✓] %~1%NC%
exit /b 0

:print_error
echo %RED%[✗] %~1%NC%
exit /b 1

:print_warning
echo %YELLOW%[!] %~1%NC%
exit /b 0 