import asyncio
import logging
import os
from datetime import datetime
import pygetwindow as gw
import keyboard
import mouse
from PIL import ImageGrab
from .utils.sqlite_manager import SQLiteManager
from .utils.sync_manager import SyncManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ActivityMonitor:
    def __init__(self, supabase_url: str, supabase_key: str, user_id: str):
        self.user_id = user_id
        self.sqlite = SQLiteManager()
        self.sync_manager = SyncManager(supabase_url, supabase_key, self.sqlite)
        
        # Monitoring state
        self.current_time_entry = None
        self.keystroke_count = 0
        self.mouse_events = 0
        self.last_activity = datetime.now()
        self.idle_time = 0
        
        # Screenshot directory
        self.screenshot_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'screenshots')
        os.makedirs(self.screenshot_dir, exist_ok=True)

    async def start_monitoring(self):
        """Start monitoring user activity."""
        try:
            # Start a new time entry
            self.current_time_entry = self.sqlite.insert_time_entry(self.user_id)
            
            # Start monitoring tasks
            await asyncio.gather(
                self._monitor_activity(),
                self._take_screenshots(),
                self._sync_data()
            )
        except Exception as e:
            logger.error(f"Error in activity monitoring: {e}")
            raise

    async def _monitor_activity(self):
        """Monitor keyboard and mouse activity."""
        try:
            while True:
                # Get active window
                active_window = gw.getActiveWindow()
                if active_window:
                    app_name = active_window.title
                    
                    # Record activity
                    activity_id = self.sqlite.insert_activity_log(
                        user_id=self.user_id,
                        time_entry_id=self.current_time_entry,
                        app_name=app_name,
                        window_title=active_window.title,
                        activity_type='window_focus',
                        keystroke_count=self.keystroke_count,
                        mouse_events=self.mouse_events,
                        idle_time=self.idle_time
                    )
                    
                    # Reset counters
                    self.keystroke_count = 0
                    self.mouse_events = 0
                    self.idle_time = 0
                    
                await asyncio.sleep(60)  # Log every minute
                
        except Exception as e:
            logger.error(f"Error monitoring activity: {e}")
            raise

    async def _take_screenshots(self):
        """Take periodic screenshots."""
        try:
            while True:
                # Take screenshot
                screenshot = ImageGrab.grab()
                
                # Save screenshot
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{self.user_id}_{timestamp}.png"
                filepath = os.path.join(self.screenshot_dir, filename)
                screenshot.save(filepath)
                
                # Record in database
                self.sqlite.insert_screenshot(
                    user_id=self.user_id,
                    time_entry_id=self.current_time_entry,
                    local_file_path=filepath
                )
                
                await asyncio.sleep(300)  # Screenshot every 5 minutes
                
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            raise

    async def _sync_data(self):
        """Periodically sync data with Supabase."""
        try:
            while True:
                await self.sync_manager.sync_data()
                await asyncio.sleep(300)  # Sync every 5 minutes
                
        except Exception as e:
            logger.error(f"Error syncing data: {e}")
            raise

    def _on_keyboard_event(self, event):
        """Handle keyboard events."""
        self.keystroke_count += 1
        self.last_activity = datetime.now()

    def _on_mouse_event(self, event):
        """Handle mouse events."""
        self.mouse_events += 1
        self.last_activity = datetime.now()

    def stop_monitoring(self):
        """Stop monitoring and clean up."""
        try:
            if self.current_time_entry:
                end_time = datetime.now().isoformat()
                self.sqlite.update_time_entry(
                    self.current_time_entry,
                    end_time=end_time
                )
            
            # Final sync
            asyncio.run(self.sync_manager.sync_data())
            
        except Exception as e:
            logger.error(f"Error stopping monitoring: {e}")
            raise

def start_monitoring(supabase_url: str, supabase_key: str, user_id: str):
    """Start the monitoring process."""
    monitor = ActivityMonitor(supabase_url, supabase_key, user_id)
    
    # Set up event listeners
    keyboard.on_press(monitor._on_keyboard_event)
    mouse.on_click(monitor._on_mouse_event)
    mouse.on_move(monitor._on_mouse_event)
    
    try:
        # Run the monitoring loop
        asyncio.run(monitor.start_monitoring())
    except KeyboardInterrupt:
        monitor.stop_monitoring()
    finally:
        # Clean up event listeners
        keyboard.unhook_all()
        mouse.unhook_all() 