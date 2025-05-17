import uuid
import os
from datetime import datetime
import platform
import cv2
import numpy as np
import pyautogui
from utils.sqlite_manager import SQLiteManager

TERMINAL_APPS = [
    "cmd.exe", "powershell.exe", "conhost.exe", # Windows
    "gnome-terminal", "xterm", "konsole", "bash", "zsh" # Linux
]

def is_terminal_active():
    try:
        import psutil
        for proc in psutil.process_iter(['name']):
            name = proc.info['name']
            if name and name.lower() in TERMINAL_APPS:
                if proc.status() == psutil.STATUS_RUNNING:
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
        if is_terminal_active():
            return None
        file_id = str(uuid.uuid4())
        file_path = os.path.join(self.output_dir, f"{file_id}.mp4")
        timestamp = datetime.utcnow().isoformat()
        screen = pyautogui.size()
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(file_path, fourcc, 20.0, (screen.width, screen.height))
        start_time = datetime.now()
        while (datetime.now() - start_time).seconds < duration:
            img = pyautogui.screenshot()
            frame = np.array(img)
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            out.write(frame)
        out.release()
        file_size = os.path.getsize(file_path)
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
        self.sqlite_db.cleanup_old_media("recordings", self.output_dir)
        return {"id": file_id, "count": self.sqlite_db.get_count("recordings", self.user_id)} 