import sys
import time
import platform
import os
import psutil
import subprocess
from datetime import datetime
from typing import Optional, Dict
from loguru import logger
from src.utils.database import LocalDatabase
import logging

# Platform-specific imports
if platform.system() == "Windows":
    import win32gui
    import win32process
elif platform.system() == "Darwin":
    try:
        from AppKit import NSWorkspace, NSRunningApplication
    except ImportError:
        NSWorkspace = None
        logger.warning("NSWorkspace not available. App usage tracking may be limited on macOS.")
elif platform.system() == "Linux":
    import subprocess

logger = logging.getLogger(__name__)

class AppUsageCollector:
    def __init__(self, user_id: str, db=None):
        self.user_id = user_id
        self.current_app = None
        self.current_window = None
        self.start_time = None
        self.last_flush_time = time.time()
        self.flush_interval = 300  # 5 minutes
        self.db = db if db is not None else LocalDatabase()  # Initialize with LocalDatabase if not provided
        self.logger = logging.getLogger(__name__)

    def get_active_window(self) -> Dict[str, str]:
        """Get information about the currently active window."""
        try:
        system = platform.system()
            
        if system == "Windows":
                return self._get_active_window_windows()
            elif system == "Darwin":  # macOS
                return self._get_active_window_macos()
            elif system == "Linux":
                return self._get_active_window_linux()
            else:
                self.logger.warning(f"Unsupported platform: {system}")
                return {"app_name": "unknown", "window_title": "unknown"}
                
        except Exception as e:
            self.logger.error(f"Error getting active window: {str(e)}")
            return {"app_name": "error", "window_title": "error"}

    def _get_active_window_windows(self) -> Dict[str, str]:
        """Get active window info on Windows."""
            try:
                hwnd = win32gui.GetForegroundWindow()
            window_title = win32gui.GetWindowText(hwnd)
            _, process_id = win32process.GetWindowThreadProcessId(hwnd)
            if process_id <= 0:
                return {"app_name": "unknown", "window_title": "unknown"}
            process = psutil.Process(process_id)
                app_name = process.name()
            return {
                "app_name": app_name,
                "window_title": window_title,
                "cpu_usage": process.cpu_percent(),
                "memory_usage": process.memory_info().rss
            }
            except Exception as e:
            self.logger.error(f"Error getting Windows window info: {str(e)}")
            return {"app_name": "unknown", "window_title": "unknown"}

    def _get_active_window_macos(self) -> Dict[str, str]:
        """Get active window info on macOS."""
        try:
            if NSWorkspace is None:
                return {"app_name": "unknown", "window_title": "unknown"}
                
            workspace = NSWorkspace.sharedWorkspace()
            active_app = workspace.activeApplication()
            
            if not active_app:
                return {"app_name": "unknown", "window_title": "unknown"}
                
            app_name = active_app.get('NSApplicationName', 'unknown')
            window_title = app_name  # Use app name as window title on macOS
            
            return {
                "app_name": app_name,
                "window_title": window_title,
                "cpu_usage": 0,  # macOS doesn't provide easy CPU usage
                "memory_usage": 0  # macOS doesn't provide easy memory usage
            }
            except Exception as e:
            self.logger.error(f"Error getting macOS window info: {str(e)}")
            return {"app_name": "unknown", "window_title": "unknown"}

    def _get_active_window_linux(self) -> Dict[str, str]:
        """Get active window info on Linux."""
            try:
            # Get active window ID
            window_id = subprocess.check_output(['xdotool', 'getactivewindow']).decode().strip()
            if not window_id:
                return {"app_name": "unknown", "window_title": "unknown"}
            
            # Get window title
            window_title = subprocess.check_output(['xdotool', 'getwindowname', window_id]).decode().strip()
            
            # Get process ID
            pid_str = subprocess.check_output(['xdotool', 'getwindowpid', window_id]).decode().strip()
            if not pid_str:
                return {"app_name": "unknown", "window_title": "unknown"}
                
            pid = int(pid_str)
            process = psutil.Process(pid)
            app_name = process.name()
            
            return {
                "app_name": app_name,
                "window_title": window_title,
                "cpu_usage": process.cpu_percent(),
                "memory_usage": process.memory_info().rss
            }
            except Exception as e:
            self.logger.error(f"Error getting Linux window info: {str(e)}")
            return {"app_name": "unknown", "window_title": "unknown"}

    def collect(self) -> Dict[str, str]:
        """Collect app usage data."""
        try:
        window_info = self.get_active_window()
            current_time = time.time()
            
            if (self.current_app != window_info["app_name"] or 
                self.current_window != window_info["window_title"] or 
                current_time - self.last_flush_time >= self.flush_interval):
                
                if self.start_time is not None and self.db is not None:
                    duration = int(current_time - self.start_time)
                    if duration > 0:
                        self.db.insert_app_usage(
                            user_id=self.user_id,
                            timestamp=datetime.fromtimestamp(self.start_time).isoformat(),
                            app_name=self.current_app,
                            window_title=self.current_window,
                            duration=duration
                        )
                
                self.current_app = window_info["app_name"]
                self.current_window = window_info["window_title"]
                self.start_time = current_time
                self.last_flush_time = current_time
            
            return window_info
        except Exception as e:
            self.logger.error(f"Error collecting app usage: {str(e)}")
            raise

    def flush(self):
        """Flush any remaining app usage data."""
        try:
            if self.start_time is not None and self.db is not None:
                current_time = time.time()
                duration = int(current_time - self.start_time)
                if duration > 0:
                    self.db.insert_app_usage(
                        user_id=self.user_id,
                        timestamp=datetime.fromtimestamp(self.start_time).isoformat(),
                        app_name=self.current_app,
                        window_title=self.current_window,
                        duration=duration
                    )
                    self.logger.info(f"App usage (flush): {{'user_id': '{self.user_id}', 'timestamp': '{datetime.fromtimestamp(self.start_time).isoformat()}', 'app_name': '{self.current_app}', 'window_title': '{self.current_window}', 'duration': {duration}}}")
                self.start_time = None
        except Exception as e:
            self.logger.error(f"Error flushing app usage: {str(e)}")
            raise

    def close(self):
        """Clean up resources."""
        try:
            self.flush()
            if self.db:
                self.db.close()
        except Exception as e:
            self.logger.error(f"Error closing app usage collector: {str(e)}")
            raise 