# WorkMatrix Background-App

This folder contains the backend (Background-App) for WorkMatrix. It is responsible for collecting (screenshots, activity, etc.) and synchronizing data (via Supabase) and communicating (via WebSocket and REST API) with the frontend.

## Prerequisites

- Python 3.8 (or higher) installed and available in your PATH.
- (Optional) A Python virtual environment (e.g. using venv) is recommended.

## Deployment (Local)

### macOS

1. Open a terminal and navigate to the project root (e.g. `cd /path/to/surveillance-Application-main`).
2. (Optional) Create and activate a virtual environment:
   ```sh
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies (if not using a venv, you may need to use `pip install –r Background-App/requirements.txt`).
4. Run the app (using the “clickable” script):
   - Make the script executable (first time only):
     ```sh
     chmod +x Background-App/scripts/macos/run_workmatrix.command
     ```
   - Double-click the script in Finder or run it from terminal:
     ```sh
     ./Background-App/scripts/macos/run_workmatrix.command
     ```
5. (Optional) If you want to run the app as a service (using a plist file), refer to the macOS service documentation (e.g. in `Background-App/macos/`).

### Linux

1. Open a terminal and navigate to the project root (e.g. `cd /path/to/surveillance-Application-main`).
2. (Optional) Create and activate a virtual environment:
   ```sh
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies (if not using a venv, you may need to use `pip install –r Background-App/requirements.txt`).
4. Run the app (using the “clickable” script):
   - Make the script executable (first time only):
     ```sh
     chmod +x Background-App/scripts/linux/run_workmatrix.sh
     ```
   - Double-click the script in your file manager or run it from terminal:
     ```sh
     ./Background-App/scripts/linux/run_workmatrix.sh
     ```
5. (Optional) If you want to run the app as a service (using systemd), refer to the Linux service documentation (e.g. in `Background-App/linux/`).

### Windows

1. Open a terminal (or PowerShell) and navigate to the project root (e.g. `cd D:\Surveillance-Application\surveillance-Application-main`).
2. (Optional) Create and activate a virtual environment:
   ```sh
   python –m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies (if not using a venv, you may need to use `pip install –r Background-App\requirements.txt`).
4. Run the app (using the “clickable” batch file):
   - Double-click `Background-App\scripts\windows\run_workmatrix.bat` in File Explorer.
   - Or, right-click and create a shortcut (e.g. on your Desktop) for easy access.
5. (Optional) If you want to run the app as a Windows service, refer to the Windows service documentation (e.g. in `Background-App/windows/`).

## How Everything Is Tied Together

- **Backend (Background-App):**
  - The main entry point is `run.py` (which calls `src/main.py`). It starts a WebSocket server, an API monitor, and an HTTP server.
  - Data (screenshots, activity, etc.) is collected and (optionally) synchronized (via Supabase) and exposed via REST endpoints.
  - (See `Background-App/scripts/README.md` for further details on the “clickable” scripts.)

- **Frontend (Front-End):**
  - The frontend (written in Next.js) connects to the backend via a custom WebSocket service (using `useWebSocket` in `websocket-service`) and REST API endpoints.
  - It also uses Supabase for real-time updates (via Realtime subscriptions) and authentication.
  - (Refer to the Front-End README for further details.)

## Troubleshooting

- **Logs:** Check the terminal output or logs in `Background-App/logs/`.
- **Dependencies:** Ensure that you have installed (or upgraded) dependencies (using `pip install –r Background-App/requirements.txt`).
- **Virtual Environment:** If you use a venv, make sure it is activated (e.g. `source .venv/bin/activate` (macOS/Linux) or `.venv\Scripts\activate` (Windows)).
- **Scripts:** If you encounter issues with the “clickable” scripts, refer to the detailed instructions in `Background-App/scripts/README.md`.

## Further Documentation

- For details on the “clickable” scripts (macOS, Linux, Windows) and how to use them, see [Background-App/scripts/README.md](scripts/README.md). 