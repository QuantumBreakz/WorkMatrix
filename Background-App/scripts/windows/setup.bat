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
call :print_status "Starting WorkMatrix installation..."

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    call :print_error "Please run this script as Administrator"
    pause
    exit /b 1
)

:: Check if Python 3.8+ is installed
python --version > nul 2>&1
if errorlevel 1 (
    call :print_error "Python is not installed"
    exit /b 1
)

:: Create necessary directories
call :print_status "Creating necessary directories..."
if not exist "data\screenshots" mkdir "data\screenshots"
if not exist "data\recordings" mkdir "data\recordings"
if not exist "data\logs" mkdir "data\logs"

:: Create virtual environment
call :print_status "Setting up virtual environment..."
python -m venv venv
call venv\Scripts\activate.bat
if errorlevel 1 (
    call :print_error "Failed to create virtual environment"
    exit /b 1
)

:: Install dependencies
call :print_status "Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    call :print_error "Failed to install dependencies"
    exit /b 1
)

:: Setup environment variables
call :print_status "Setting up environment variables..."
if not exist ".env" (
    (
        echo # Supabase Configuration
        echo SUPABASE_URL=your_supabase_url
        echo SUPABASE_KEY=your_supabase_anon_key
        echo.
        echo # Application Settings
        echo SCREENSHOT_INTERVAL=300  # 5 minutes in seconds
        echo SYNC_INTERVAL=1800      # 30 minutes in seconds
        echo MAX_STORAGE_MB=450      # Maximum local storage in MB
    ) > .env
    call :print_warning "Created .env file. Please update with your Supabase credentials"
)

:: Create startup script
call :print_status "Creating startup script..."
(
    echo @echo off
    echo cd /d "%%~dp0"
    echo call venv\Scripts\activate.bat
    echo python src\main.py
) > start_workmatrix.bat

:: Install Windows service
call :print_status "Installing Windows service..."
call install_windows_service.bat

call :print_status "Installation completed successfully!"
call :print_warning "Please update the .env file with your Supabase credentials"
call :print_status "The application will start automatically at system startup"
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