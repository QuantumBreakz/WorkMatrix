import uuid
import os
from datetime import datetime
import platform
import pyautogui
from PIL import Image
from utils.sqlite_manager import SQLiteManager
from pathlib import Path

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

class ScreenshotCollector:
    def __init__(self, user_id, output_dir="data/screenshots"):
        self.user_id = user_id
        self.output_dir = Path(output_dir)
        self.sqlite_db = SQLiteManager()
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def capture_screenshot(self):
        if is_terminal_active():
            return None
        
        timestamp_dt = datetime.utcnow()
        timestamp_iso = timestamp_dt.isoformat()
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}.webp"
        local_file_path = str(self.output_dir / file_name)

        try:
            screenshot = pyautogui.screenshot()
            if screenshot.mode == 'RGBA':
                screenshot = screenshot.convert('RGB')
            screenshot.save(local_file_path, "WEBP", quality=80)
            file_size = Path(local_file_path).stat().st_size
        except Exception as e:
            print(f"Error capturing/saving screenshot: {e}")
            return None

        data = {
            "id": file_id,
            "user_id": self.user_id,
            "timestamp": timestamp_iso,
            "local_file_path": local_file_path,
            "supabase_storage_path": None,
            "file_size": file_size,
            "created_at": timestamp_iso,
            "is_synced_to_activity_log": 0
        }
        
        try:
            self.sqlite_db.insert_record("screenshots", data)
        except Exception as e:
            print(f"Error inserting screenshot metadata to local DB: {e}")
            try:
                Path(local_file_path).unlink(missing_ok=True)
            except Exception as unlink_e:
                print(f"Error deleting orphaned screenshot {local_file_path}: {unlink_e}")
            return None

        return {"id": file_id, "local_file_path": local_file_path, "timestamp": timestamp_iso}

    def cleanup_old_screenshots(self, days: int = 30):
        """Clean up old screenshots."""
        try:
            # Delete old files
            for file in self.output_dir.glob("*.webp"):
                if (datetime.now() - datetime.fromtimestamp(file.stat().st_mtime)).days > days:
                    file.unlink()
                    print(f"Deleted old screenshot: {file.name}")
            
            # Clean up database records
            self.sqlite_db.cleanup_old_data(days)
            
        except Exception as e:
            print(f"Error cleaning up screenshots: {str(e)}")

    def get_storage_usage(self) -> int:
        """
        Get total storage used by screenshots in bytes.
        """
        try:
            total_size = sum(
                f.stat().st_size for f in self.output_dir.glob("*.webp")
            )
            return total_size
        except Exception as e:
            print(f"Error calculating storage usage: {str(e)}")
            return 0 