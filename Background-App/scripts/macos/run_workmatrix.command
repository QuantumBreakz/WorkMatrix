#!/bin/bash

# Change to the project root (adjust the path if run_workmatrix.command is not in Background-App/scripts/macos)
cd "$(dirname "$0")/../../.."

# Optionally activate a virtual environment (if .venv exists)
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install (or upgrade) dependencies (optional, uncomment if you want to ensure dependencies are up to date)
pip install -r Background-App/requirements.txt

# Run the app (using run.py as the entry point)
python Background-App/run.py

# (Optional) If you want to keep the terminal open (so you can see output) after the app exits, uncomment the following line:
# read -p "Press [Enter] to exit." 