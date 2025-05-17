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
call :print_status "Starting WorkMatrix monitoring..."

:: Check service status
call :print_status "Checking service status..."
sc query WorkMatrix > nul
if errorlevel 1 (
    call :print_error "Service is not running"
) else (
    call :print_status "Service is running"
)

:: Check storage usage
call :print_status "Checking storage usage..."
set "max_storage_mb=450"
for /f "tokens=1" %%a in ('dir /s /a "data\screenshots" ^| find "File(s)"') do set "current_storage_mb=%%a"
set /a "usage_percent=current_storage_mb * 100 / max_storage_mb"

if !usage_percent! geq 90 (
    call :print_error "Storage usage critical: !current_storage_mb!MB (!usage_percent!%%)"
) else if !usage_percent! geq 75 (
    call :print_warning "Storage usage high: !current_storage_mb!MB (!usage_percent!%%)"
) else (
    call :print_status "Storage usage normal: !current_storage_mb!MB (!usage_percent!%%)"
)

:: Check log files
call :print_status "Checking log files..."
set "error_count=0"
for /f "tokens=*" %%a in ('findstr /C:"ERROR" "data\logs\workmatrix.log"') do set /a "error_count+=1"

if !error_count! gtr 0 (
    call :print_warning "Found !error_count! errors in log file"
) else (
    call :print_status "No errors found in log file"
)

:: Check API usage
call :print_status "Checking API usage..."
call :print_warning "API usage check not implemented"

call :print_status "Monitoring completed"
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