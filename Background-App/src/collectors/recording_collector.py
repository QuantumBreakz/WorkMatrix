import uuid
import os
from datetime import datetime
import platform
import cv2
import numpy as np
import pyautogui
from pathlib import Path
import psutil
from src.utils.sqlite_manager import SQLiteManager
from src.utils.config import VIDEOS_DIR, VIDEO_DURATION, VIDEO_QUALITY
import logging

logger = logging.getLogger(__name__)

TERMINAL_APPS = [
    "cmd.exe", "powershell.exe", "conhost.exe", # Windows
    "gnome-terminal", "xterm", "konsole", "bash", "zsh" # Linux
]

def is_terminal_active():
    """Check if any terminal application is active."""
    try:
        for proc in psutil.process_iter(['name', 'status']):
            name = proc.info['name']
            if name and name.lower() in TERMINAL_APPS:
                if proc.info['status'] == psutil.STATUS_RUNNING:
                    return True
    except Exception:
        pass
    return False

class RecordingCollector:
    def __init__(self, user_id, output_dir="data/recordings"):
        self.user_id = user_id
        self.output_dir = output_dir
        self.sqlite_db = SQLiteManager()
        os.makedirs(output_dir, exist_ok=True)

    def capture_recording(self, duration=10):
        """Capture a screen recording."""
        if is_terminal_active():
            return None

        try:
            file_id = str(uuid.uuid4())
            file_path = os.path.join(self.output_dir, f"{file_id}.mp4")
            timestamp = datetime.utcnow().isoformat()
            screen = pyautogui.size()
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(file_path, fourcc, 20.0, (screen.width, screen.height))
            
            if not out.isOpened():
                raise Exception("Failed to open video writer")

            start_time = datetime.now()
            while (datetime.now() - start_time).seconds < duration:
                img = pyautogui.screenshot()
                frame = np.array(img)
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                out.write(frame)

            out.release()
            file_size = os.path.getsize(file_path)
            
            if file_size == 0:
                raise Exception("Recording file is empty")

            data = {
                "id": file_id,
                "user_id": self.user_id,
                "timestamp": timestamp,
                "file_path": file_path,
                "file_size": file_size,
                "duration": duration,
                "created_at": timestamp
            }
            self.sqlite_db.insert_record("recordings", data)
            return data

        except Exception as e:
            logger.error(f"Error capturing recording: {str(e)}")
            if os.path.exists(file_path):
                os.remove(file_path)
            raise

    @property
    def db(self):
        return self.sqlite_db

    def cleanup_old_recordings(self, days=7):
        """Clean up old recordings."""
        try:
            if hasattr(self.sqlite_db, 'cleanup_old_media'):
                self.sqlite_db.cleanup_old_media("recordings", self.output_dir, days)
            else:
                self.sqlite_db.delete_old_media("recordings", self.output_dir, days)
            logger.info(f"Cleaned up recordings older than {days} days")
        except Exception as e:
            logger.error(f"Error cleaning up recordings: {str(e)}")
            raise

    def close(self):
        """Close the database connection and clean up resources."""
        try:
            if hasattr(self, 'sqlite_db'):
                self.sqlite_db.close()
            logger.info("Recording collector closed")
        except Exception as e:
            logger.error(f"Error closing recording collector: {str(e)}")
            raise 