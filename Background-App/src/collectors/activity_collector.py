import os
import time
import logging
import psutil
import sys
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from ..utils.database import LocalDatabase

# Only import these on Windows
if sys.platform == "win32":
    import win32gui
    import win32process
else:
    win32gui = None
    win32process = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/activity.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ActivityCollector:
    def __init__(self, user_id: str, idle_threshold: int = 300):
        self.user_id = user_id
        self.db = LocalDatabase()
        self.last_activity_time = time.time()
        self.last_window_title = ""
        self.last_app_name = ""
        self.idle_threshold = idle_threshold  # seconds
        self.is_idle = False
        self.idle_start_time = None
        self.total_idle_time = 0
        self.total_active_time = 0
        logger.info(f"Activity collector initialized for user {user_id}")

    def get_active_window_info(self) -> Dict[str, Optional[object]]:
        """Get information about the currently active window (Windows only)."""
        if sys.platform != "win32" or win32gui is None or win32process is None:
            return {
                "app_name": None,
                "window_title": None,
                "process_id": None,
                "cpu_usage": 0.0,
                "memory_usage": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

        try:
            window_handle = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(window_handle)
            process = psutil.Process(pid)
            app_name = process.name()
            window_title = win32gui.GetWindowText(window_handle)

            cpu_percent = process.cpu_percent(interval=None)
            memory_info = process.memory_info()

            return {
                "app_name": app_name,
                "window_title": window_title,
                "process_id": pid,
                "cpu_usage": cpu_percent,
                "memory_usage": memory_info.rss,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting active window info: {e}")
            return {
                "app_name": "unknown",
                "window_title": "unknown",
                "process_id": None,
                "cpu_usage": 0.0,
                "memory_usage": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

    def check_idle_state(self) -> bool:
        """Check if the system is idle based on time since last activity."""
        current_time = time.time()
        idle_duration = current_time - self.last_activity_time

        if idle_duration >= self.idle_threshold and not self.is_idle:
            self.is_idle = True
            self.idle_start_time = current_time
            logger.info("System entered idle state")
            return True

        if idle_duration < self.idle_threshold and self.is_idle:
            self.is_idle = False
            if self.idle_start_time is not None:
                self.total_idle_time += current_time - self.idle_start_time
                self.idle_start_time = None
            logger.info("System returned from idle state")
            return False

        return self.is_idle

    def collect_activity(self) -> Optional[Dict]:
        """Collect and log activity whenever something changes."""
        try:
            now = time.time()
            info = self.get_active_window_info()
            is_idle = self.check_idle_state()
            delta = now - self.last_activity_time

            if not is_idle:
                self.total_active_time += delta

            # Only log on state or window/app change
            if (
                info["window_title"] != self.last_window_title or
                info["app_name"]     != self.last_app_name or
                is_idle              != self.is_idle
            ):
                record = {
                    "user_id":         self.user_id,
                    "app_name":        info["app_name"],
                    "window_title":    info["window_title"],
                    "activity_type":   "idle" if is_idle else "window_focus",
                    "cpu_usage":       info["cpu_usage"],
                    "memory_usage":    info["memory_usage"],
                    "is_idle":         is_idle,
                    "idle_duration":   delta if is_idle else 0,
                    "total_idle_time": self.total_idle_time,
                    "total_active_time": self.total_active_time,
                    "created_at":      datetime.utcnow().isoformat()
                }

                self.db.insert_activity_log(record)

                # update last-known values
                self.last_window_title = info["window_title"]
                self.last_app_name     = info["app_name"]
                self.last_activity_time = now

                return record

        except Exception as e:
            logger.error(f"Error collecting activity: {e}")
        return None

    def get_recent_activity(self, limit: int = 10) -> List[Dict]:
        try:
            return self.db.get_recent_activity_logs(limit)
        except Exception as e:
            logger.error(f"Error retrieving recent activity: {e}")
            return []

    def get_activity_summary(self, start: datetime, end: datetime) -> Dict:
        try:
            logs = self.db.get_activity_logs_between(start, end)
            usage: Dict[str, float] = {}
            total = 0.0
            last_time = None
            last_app = None

            for entry in logs:
                ts = datetime.fromisoformat(entry["created_at"])
                if last_time and last_app:
                    diff = (ts - last_time).total_seconds()
                    usage[last_app] = usage.get(last_app, 0.0) + diff
                    total += diff
                last_time = ts
                last_app = entry["app_name"]

            return {
                "total_time": total,
                "app_usage": usage,
                "start_time": start.isoformat(),
                "end_time": end.isoformat()
            }
        except Exception as e:
            logger.error(f"Error computing activity summary: {e}")
            return {"total_time": 0, "app_usage": {}, "start_time": start.isoformat(), "end_time": end.isoformat()}

    def cleanup_old_activity(self, days: int = 7) -> None:
        try:
            cutoff = datetime.utcnow() - timedelta(days=days)
            self.db.delete_old_activity_logs(cutoff)
            logger.info(f"Cleaned up logs older than {days} days")
        except Exception as e:
            logger.error(f"Error cleaning up old activity: {e}")

    def close(self) -> None:
        try:
            self.db.close()
            logger.info("Activity collector closed")
        except Exception as e:
            logger.error(f"Error closing collector: {e}")
