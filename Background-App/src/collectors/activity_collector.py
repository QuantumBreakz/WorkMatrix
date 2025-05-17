import os
import time
import logging
import psutil
import win32gui
import win32process
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from ..utils.database import LocalDatabase

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

    def get_active_window_info(self) -> Dict[str, str]:
        """Get information about the currently active window."""
        try:
            window = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(window)
            process = psutil.Process(pid)
            app_name = process.name()
            window_title = win32gui.GetWindowText(window)
            
            # Get additional process info
            cpu_percent = process.cpu_percent()
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
            logger.error(f"Error getting active window info: {str(e)}")
            return {
                "app_name": "unknown",
                "window_title": "unknown",
                "process_id": None,
                "cpu_usage": 0,
                "memory_usage": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

    def check_idle_state(self) -> bool:
        """Check if the system is in an idle state."""
        current_time = time.time()
        idle_duration = current_time - self.last_activity_time

        if idle_duration >= self.idle_threshold and not self.is_idle:
            # Transition to idle state
            self.is_idle = True
            self.idle_start_time = current_time
            logger.info("System entered idle state")
            return True
        elif idle_duration < self.idle_threshold and self.is_idle:
            # Transition from idle to active
            self.is_idle = False
            if self.idle_start_time:
                self.total_idle_time += current_time - self.idle_start_time
                self.idle_start_time = None
            logger.info("System returned from idle state")
            return False
        
        return self.is_idle

    def collect_activity(self) -> Optional[Dict]:
        """Collect current activity data."""
        try:
            current_time = time.time()
            window_info = self.get_active_window_info()
            is_idle = self.check_idle_state()
            
            # Calculate time deltas
            time_since_last = current_time - self.last_activity_time
            if not is_idle:
                self.total_active_time += time_since_last

            # Only log if the window or app has changed, or if transitioning idle state
            if (window_info["window_title"] != self.last_window_title or 
                window_info["app_name"] != self.last_app_name or
                is_idle != self.is_idle):
                
                activity_data = {
                    "user_id": self.user_id,
                    "app_name": window_info["app_name"],
                    "window_title": window_info["window_title"],
                    "activity_type": "window_focus" if not is_idle else "idle",
                    "cpu_usage": window_info["cpu_usage"],
                    "memory_usage": window_info["memory_usage"],
                    "is_idle": is_idle,
                    "idle_duration": time_since_last if is_idle else 0,
                    "total_idle_time": self.total_idle_time,
                    "total_active_time": self.total_active_time,
                    "created_at": datetime.utcnow().isoformat()
                }

                # Store in local database
                self.db.insert_activity_log(activity_data)

                # Update last known state
                self.last_window_title = window_info["window_title"]
                self.last_app_name = window_info["app_name"]
                self.last_activity_time = current_time

                return activity_data

        except Exception as e:
            logger.error(f"Error collecting activity: {str(e)}")
            return None

    def get_recent_activity(self, limit: int = 10) -> List[Dict]:
        """Get recent activity logs."""
        try:
            return self.db.get_recent_activity_logs(limit)
        except Exception as e:
            logger.error(f"Error getting recent activity: {str(e)}")
            return []

    def get_activity_summary(self, start_time: datetime, end_time: datetime) -> Dict:
        """Get activity summary for a time period."""
        try:
            logs = self.db.get_activity_logs_between(start_time, end_time)
            
            # Calculate summary statistics
            app_usage = {}
            total_time = 0
            last_time = None
            last_app = None

            for log in logs:
                current_time = datetime.fromisoformat(log["created_at"])
                
                if last_time and last_app:
                    time_diff = (current_time - last_time).total_seconds()
                    app_usage[last_app] = app_usage.get(last_app, 0) + time_diff
                    total_time += time_diff

                last_time = current_time
                last_app = log["app_name"]

            return {
                "total_time": total_time,
                "app_usage": app_usage,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting activity summary: {str(e)}")
            return {
                "total_time": 0,
                "app_usage": {},
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }

    def cleanup_old_activity(self, days: int = 7) -> None:
        """Clean up activity logs older than specified days."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            self.db.delete_old_activity_logs(cutoff_date)
            logger.info(f"Cleaned up activity logs older than {days} days")
        except Exception as e:
            logger.error(f"Error cleaning up old activity: {str(e)}")

    def close(self) -> None:
        """Close the database connection."""
        try:
            self.db.close()
            logger.info("Activity collector closed")
        except Exception as e:
            logger.error(f"Error closing activity collector: {str(e)}") 