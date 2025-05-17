import psutil
import time
from datetime import datetime
import logging
from pynput import mouse, keyboard
from pathlib import Path
from src.utils.database import LocalDatabase
from src.utils.config import ACTIVITY_LOG_FILE
import uuid
import platform
from utils.sqlite_manager import SQLiteManager

logger = logging.getLogger(__name__)

TERMINAL_APPS = {
    "Windows": ["cmd.exe", "powershell.exe", "conhost.exe"],
    "Linux": ["gnome-terminal", "xterm", "konsole", "bash", "zsh"]
}

def is_terminal_active():
    try:
        for proc in psutil.process_iter(['name']):
            name = proc.info['name']
            if name and name.lower() in TERMINAL_APPS.get(platform.system(), []):
                if proc.status() == psutil.STATUS_RUNNING:
                    return True
    except Exception:
        pass
    return False

class ActivityCollector:
    def __init__(self, user_id):
        self.user_id = user_id
        self.sqlite_db = SQLiteManager()
        self.activity_data = None
        self.mouse_events = 0
        self.keystrokes = 0
        self.is_idle = False
        self.is_break = False
        self.last_activity = time.time()
        self.idle_threshold = 300  # 5 minutes in seconds
        self.current_keys = set()  # Track currently pressed keys
        
        # Initialize mouse listener
        self.mouse_listener = mouse.Listener(
            on_move=self._on_mouse_event,
            on_click=self._on_mouse_event,
            on_scroll=self._on_mouse_event
        )
        
        # Initialize keyboard listener
        self.keyboard_listener = keyboard.Listener(
            on_press=self._on_key_press,
            on_release=self._on_key_release
        )
        
        # Start listeners
        self.mouse_listener.start()
        self.keyboard_listener.start()

    def _on_mouse_event(self, *args):
        """Track any mouse activity (move, click, scroll)."""
        self.mouse_events += 1
        self.last_activity = time.time()
        self._check_idle()

    def _on_key_press(self, key):
        """Track key presses."""
        self.keystrokes += 1
        self.last_activity = time.time()
        self._check_idle()
        
        # Add key to currently pressed keys
        self.current_keys.add(key)
        
        # Check for break hotkey (Ctrl+Shift+B)
        if hasattr(key, 'vk'):
            if key.vk == keyboard.KeyCode.from_char('b').vk:
                modifiers = keyboard.Key.ctrl_l in self.current_keys and \
                           keyboard.Key.shift_l in self.current_keys
                if modifiers:
                    self.toggle_break()

    def _on_key_release(self, key):
        """Track key releases."""
        # Remove key from currently pressed keys
        if key in self.current_keys:
            self.current_keys.remove(key)

    def _check_idle(self):
        """Check if user is idle."""
        current_time = time.time()
        if current_time - self.last_activity > self.idle_threshold:
            if not self.is_idle:
                self.is_idle = True
                logger.info("User is idle")
        else:
            if self.is_idle:
                self.is_idle = False
                logger.info("User is active")

    def toggle_break(self):
        """Toggle break state."""
        self.is_break = not self.is_break
        logger.info(f"Break {'started' if self.is_break else 'ended'}")

    def collect_activity(self):
        if is_terminal_active():
            logger.info("Terminal is active, skipping app usage logging for this interval.")
            current_keystrokes = self.keystrokes
            current_mouse_events = self.mouse_events
            self.keystrokes = 0
            self.mouse_events = 0
            return None

        active_window_title = "Unknown"
        try:
            import pygetwindow as gw
            win = gw.getActiveWindow()
            if win and win.title:
                active_window_title = win.title
            else:
                logger.debug("No active window found or window has no title.")
        except ImportError:
            logger.warning("pygetwindow not installed, cannot get active window title.")
        except Exception as e:
            logger.error(f"Error getting active window title: {str(e)}")

        current_keystrokes = self.keystrokes
        current_mouse_events = self.mouse_events
        self.keystrokes = 0
        self.mouse_events = 0

        data = {
            "id": str(uuid.uuid4()),
            "user_id": self.user_id,
            "app_name": active_window_title,
            "window_title": active_window_title,
            "duration": 60,
            "keystroke_count": current_keystrokes,
            "mouse_event_count": current_mouse_events,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        try:
            self.sqlite_db.insert_record("app_usage", data)
            logger.info(f"Locally stored activity: {current_keystrokes} keys, {current_mouse_events} mouse events for {active_window_title}")
            self.activity_data = data
            return data
        except Exception as e:
            logger.error(f"Failed to insert activity into local DB: {str(e)}")
            return None

    def stop(self):
        """Stop activity tracking."""
        self.mouse_listener.stop()
        self.keyboard_listener.stop() 