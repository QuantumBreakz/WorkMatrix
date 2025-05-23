# WorkMatrix Background-App Launch Scripts

This folder contains platform-specific scripts to easily launch the WorkMatrix Background-App locally on your machine. These scripts activate a virtual environment (if present), install dependencies, and run the application.

## Scripts

- **macOS:** `macos/run_workmatrix.command`
- **Linux:** `linux/run_workmatrix.sh`
- **Windows:** `windows/run_workmatrix.bat`

## Usage

### macOS
1. Open Terminal and navigate to this folder.
2. Make the script executable (first time only):
   ```sh
   chmod +x macos/run_workmatrix.command
   ```
3. Double-click the script in Finder or run it from Terminal:
   ```sh
   ./macos/run_workmatrix.command
   ```

### Linux
1. Open Terminal and navigate to this folder.
2. Make the script executable (first time only):
   ```sh
   chmod +x linux/run_workmatrix.sh
   ```
3. Double-click the script in your file manager or run it from Terminal:
   ```sh
   ./linux/run_workmatrix.sh
   ```

### Windows
1. Double-click `windows/run_workmatrix.bat` in File Explorer.
2. Or, right-click and create a shortcut to place on your Desktop for easy access.

## What the Scripts Do
- Change to the project root directory.
- Optionally activate a Python virtual environment (`.venv`) if present.
- Install (or upgrade) dependencies from `Background-App/requirements.txt`.
- Run the app using `python Background-App/run.py`.
- Optionally keep the terminal open after execution (see script comments).

## Notes
- Ensure you have Python 3.8+ installed and available in your PATH.
- The scripts assume the project structure has not been changed.
- For troubleshooting, check the terminal output or logs in `Background-App/logs/`. 