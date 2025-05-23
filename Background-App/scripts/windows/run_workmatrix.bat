@echo off
REM Change to the project root (adjust the path if run_workmatrix.bat is not in Background-App\scripts\windows)
cd /d "%~dp0\..\..\.."

REM Optionally activate a virtual environment (if .venv exists)
if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
)

REM (Optional) Install (or upgrade) dependencies (uncomment if you want to ensure dependencies are up to date)
pip install -r Background-App\requirements.txt

REM Run the app (using run.py as the entry point)
python Background-App\run.py

REM (Optional) If you want to keep the terminal open (so you can see output) after the app exits, uncomment the following line:
REM pause 