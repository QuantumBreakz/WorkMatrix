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
call :print_status "Starting WorkMatrix backup..."

:: Create backup directory
set "backup_dir=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "backup_dir=!backup_dir: =0!"
mkdir "!backup_dir!" 2>nul
if errorlevel 1 (
    call :print_error "Failed to create backup directory"
    exit /b 1
)

:: Load environment variables
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
) else (
    call :print_error "No .env file found"
    exit /b 1
)

:: Check Supabase credentials
if "%SUPABASE_URL%"=="" (
    call :print_error "SUPABASE_URL not found in .env"
    exit /b 1
)
if "%SUPABASE_KEY%"=="" (
    call :print_error "SUPABASE_KEY not found in .env"
    exit /b 1
)

:: Backup Supabase data
call :print_status "Exporting Supabase data..."
set "backup_file=!backup_dir!\supabase_backup.sql"
supabase db dump --db-url "%SUPABASE_URL%" > "!backup_file!"
if errorlevel 1 (
    call :print_error "Failed to create Supabase backup"
    exit /b 1
)
call :print_status "Supabase backup created: !backup_file!"

:: Backup local data
call :print_status "Backing up local data..."

:: Backup screenshots
if exist "data\screenshots" (
    xcopy /E /I /Y "data\screenshots" "!backup_dir!\screenshots" >nul
)

:: Backup logs
if exist "data\logs" (
    xcopy /E /I /Y "data\logs" "!backup_dir!\logs" >nul
)

:: Backup .env
if exist ".env" (
    copy /Y ".env" "!backup_dir!" >nul
)

call :print_status "Local data backup created in !backup_dir!"

:: Clean old backups
call :print_status "Cleaning old backups..."
set "max_backups=30"
set "count=0"
for /f "delims=" %%a in ('dir /b /o-d backups') do (
    set /a "count+=1"
    if !count! gtr %max_backups% (
        rmdir /s /q "backups\%%a"
    )
)
if !count! gtr %max_backups% (
    call :print_status "Removed !count!-%max_backups% old backups"
) else (
    call :print_status "No old backups to clean"
)

call :print_status "Backup completed successfully"
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