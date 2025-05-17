import sys
import time
import platform
from datetime import datetime
from typing import Optional, Dict
from loguru import logger

if platform.system() == "Windows":
    import psutil
    import win32gui
    import win32process
elif platform.system() == "Darwin":
    import psutil
    from AppKit import NSWorkspace
elif platform.system() == "Linux":
    import psutil
    import subprocess

class AppUsageCollector:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.last_app: Optional[str] = None
        self.last_title: Optional[str] = None
        self.last_time: float = time.time()
        self.usage_log = []  # List of (app_name, window_title, start_time, duration)

    def get_active_window(self) -> Dict[str, Optional[str]]:
        system = platform.system()
        if system == "Windows":
            try:
                hwnd = win32gui.GetForegroundWindow()
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                process = psutil.Process(pid)
                app_name = process.name()
                window_title = win32gui.GetWindowText(hwnd)
                return {"app_name": app_name, "window_title": window_title}
            except Exception as e:
                logger.error(f"Error getting active window (Windows): {e}")
                return {"app_name": None, "window_title": None}
        elif system == "Darwin":
            try:
                active_app = NSWorkspace.sharedWorkspace().frontmostApplication()
                app_name = active_app.localizedName()
                window_title = app_name  # macOS does not provide window title easily
                return {"app_name": app_name, "window_title": window_title}
            except Exception as e:
                logger.error(f"Error getting active window (macOS): {e}")
                return {"app_name": None, "window_title": None}
        elif system == "Linux":
            try:
                # Try to get the active window using xprop and wmctrl
                win_id = subprocess.check_output([
                    'xprop', '-root', '_NET_ACTIVE_WINDOW'
                ]).decode().strip().split()[-1]
                win_id = win_id if win_id != '0x0' else None
                if win_id:
                    win_name = subprocess.check_output([
                        'xprop', '-id', win_id, 'WM_NAME'
                    ]).decode()
                    window_title = win_name.split('=')[-1].strip().strip('"')
                    # Try to get the PID
                    pid_line = subprocess.check_output([
                        'xprop', '-id', win_id, '_NET_WM_PID'
                    ]).decode()
                    pid = int(pid_line.split()[-1])
                    app_name = psutil.Process(pid).name()
                    return {"app_name": app_name, "window_title": window_title}
                else:
                    return {"app_name": None, "window_title": None}
            except Exception as e:
                logger.error(f"Error getting active window (Linux): {e}")
                return {"app_name": None, "window_title": None}
        else:
            return {"app_name": None, "window_title": None}

    def collect(self) -> Optional[Dict]:
        now = time.time()
        window_info = self.get_active_window()
        app_name = window_info["app_name"]
        window_title = window_info["window_title"]
        if app_name is None:
            return None
        if (app_name != self.last_app) or (window_title != self.last_title):
            # Log the previous app usage
            if self.last_app is not None:
                duration = int(now - self.last_time)
                usage = {
                    "user_id": self.user_id,
                    "timestamp": datetime.now().isoformat(),
                    "app_name": self.last_app,
                    "window_title": self.last_title,
                    "duration": duration
                }
                self.usage_log.append(usage)
                logger.info(f"App usage: {usage}")
            # Update last seen
            self.last_app = app_name
            self.last_title = window_title
            self.last_time = now
        # Return the most recent usage if available
        if self.usage_log:
            return self.usage_log.pop(0)
        return None

    def flush(self) -> Optional[Dict]:
        # Call this on shutdown to log the last app usage
        now = time.time()
        if self.last_app is not None:
            duration = int(now - self.last_time)
            usage = {
                "user_id": self.user_id,
                "timestamp": datetime.now().isoformat(),
                "app_name": self.last_app,
                "window_title": self.last_title,
                "duration": duration
            }
            self.last_app = None
            self.last_title = None
            self.last_time = now
            logger.info(f"App usage (flush): {usage}")
            return usage
        return None 