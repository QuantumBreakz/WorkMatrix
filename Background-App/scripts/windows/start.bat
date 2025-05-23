@echo off
setlocal enabledelayedexpansion

:: Colors for output
set "GREEN=[92m"
set "RED=[91m"
set "NC=[0m"

echo %GREEN%Initializing WorkMatrix Background App...%NC%

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Python is not installed. Please install Python first.%NC%
    exit /b 1
)

:: Check if virtual environment exists
if not exist venv (
    echo %GREEN%Creating virtual environment...%NC%
    python -m venv venv
)

:: Activate virtual environment and install dependencies
echo %GREEN%Activating virtual environment...%NC%
call venv\Scripts\activate.bat

echo %GREEN%Installing/Updating dependencies...%NC%
python -m pip install --upgrade pip
pip install -r requirements.txt

:: Check if .env file exists
if not exist .env (
    echo %RED%.env file not found. Please create one with your Supabase credentials.%NC%
    exit /b 1
)

:: Start the application
echo %GREEN%Starting WorkMatrix Background App...%NC%
python src\main.py

:: Keep the window open if there's an error
if errorlevel 1 (
    echo %RED%Application crashed. Press any key to exit...%NC%
    pause >nul
) 