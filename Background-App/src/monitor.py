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
from .utils.event_manager import EventManager
from .utils.resource_manager import ResourceManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ActivityMonitor:
    def __init__(self, supabase_url: str, supabase_key: str, user_id: str):
        self.user_id = user_id
        
        # Initialize managers
        self.sqlite = SQLiteManager()
        self.event_manager = EventManager()
        self.resource_manager = ResourceManager(
            base_dir=os.path.join(os.path.dirname(__file__), '..', 'data'),
            max_storage_mb=500,  # 500MB limit for screenshots
            max_file_age_days=7,
            compression_quality=60
        )
        self.sync_manager = SyncManager(
            supabase_url=supabase_url,
            supabase_key=supabase_key,
            sqlite=self.sqlite,
            max_batch_size=50,
            sync_interval=300  # 5 minutes
        )
        
        # Monitoring state
        self.current_time_entry = None
        self.last_activity = datetime.now()
        self._running = False
        
        # Performance settings
        self.screenshot_interval = 300  # 5 minutes
        self.activity_log_interval = 60  # 1 minute
        self.idle_threshold = 300  # 5 minutes

    async def start_monitoring(self):
        """Start monitoring user activity."""
        try:
            self._running = True
            self.current_time_entry = self.sqlite.insert_time_entry(self.user_id)
            
            # Register event handlers
            self.event_manager.register_handler('keyboard', self._handle_keyboard_event)
            self.event_manager.register_handler('mouse', self._handle_mouse_event)
            self.event_manager.register_handler('window', self._handle_window_event)
            
            # Start all monitoring tasks
            await asyncio.gather(
                self.event_manager.start(),
                self._monitor_activity(),
                self._take_screenshots(),
                self.sync_manager.start(),
                self._cleanup_task()
            )
        except Exception as e:
            logger.error(f"Error in activity monitoring: {e}")
            raise
        finally:
            await self.stop_monitoring()

    async def stop_monitoring(self):
        """Stop monitoring and clean up."""
        try:
            self._running = False
            
            # Stop managers
            self.event_manager.stop()
            self.sync_manager.stop()
            
            # Update time entry
            if self.current_time_entry:
                self.sqlite.update_time_entry(
                    self.current_time_entry,
                    end_time=datetime.now().isoformat()
                )
            
            # Final sync
            await self.sync_manager.force_sync()
            
        except Exception as e:
            logger.error(f"Error stopping monitoring: {e}")
            raise

    async def _monitor_activity(self):
        """Monitor and log user activity."""
        while self._running:
            try:
                # Get active window
                active_window = gw.getActiveWindow()
                if active_window:
                    await self.event_manager.put_event('window', {
                        'app_name': active_window.title,
                        'window_title': active_window.title,
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Check for idle state
                idle_time = (datetime.now() - self.last_activity).total_seconds()
                if idle_time >= self.idle_threshold:
                    logger.info(f"User idle for {idle_time} seconds")
                
                await asyncio.sleep(self.activity_log_interval)
                
            except Exception as e:
                logger.error(f"Error in activity monitoring: {e}")
                await asyncio.sleep(5)  # Wait before retrying

    async def _take_screenshots(self):
        """Take periodic screenshots."""
        while self._running:
            try:
                # Skip if user is idle
                idle_time = (datetime.now() - self.last_activity).total_seconds()
                if idle_time < self.idle_threshold:
                    screenshot = ImageGrab.grab()
                    filepath = await self.resource_manager.save_screenshot(
                        screenshot,
                        self.user_id
                    )
                    
                    if filepath:
                        self.sqlite.insert_screenshot(
                            user_id=self.user_id,
                            time_entry_id=self.current_time_entry,
                            local_file_path=filepath
                        )
                
                await asyncio.sleep(self.screenshot_interval)
                
            except Exception as e:
                logger.error(f"Error taking screenshot: {e}")
                await asyncio.sleep(5)  # Wait before retrying

    async def _cleanup_task(self):
        """Periodic cleanup task."""
        while self._running:
            try:
                await self.resource_manager.cleanup_old_files()
                await asyncio.sleep(3600)  # Run cleanup every hour
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
                await asyncio.sleep(300)  # Wait before retrying

    async def _handle_keyboard_event(self, event):
        """Handle keyboard events."""
        self.last_activity = datetime.now()
        self.sqlite.insert_activity_log(
            user_id=self.user_id,
            time_entry_id=self.current_time_entry,
            activity_type='keyboard',
            keystroke_count=1,
            mouse_events=0
        )

    async def _handle_mouse_event(self, event):
        """Handle mouse events."""
        self.last_activity = datetime.now()
        self.sqlite.insert_activity_log(
            user_id=self.user_id,
            time_entry_id=self.current_time_entry,
            activity_type='mouse',
            keystroke_count=0,
            mouse_events=1
        )

    async def _handle_window_event(self, event):
        """Handle window focus events."""
        self.sqlite.insert_activity_log(
            user_id=self.user_id,
            time_entry_id=self.current_time_entry,
            app_name=event['app_name'],
            window_title=event['window_title'],
            activity_type='window_focus',
            keystroke_count=0,
            mouse_events=0
        )

def start_monitoring(supabase_url: str, supabase_key: str, user_id: str):
    """Start the monitoring process."""
    monitor = ActivityMonitor(supabase_url, supabase_key, user_id)
    
    try:
        # Set up keyboard and mouse hooks
        keyboard.hook(lambda e: asyncio.create_task(
            monitor.event_manager.put_event('keyboard', {'event': e})
        ))
        mouse.hook(lambda e: asyncio.create_task(
            monitor.event_manager.put_event('mouse', {'event': e})
        ))
        
        # Run the monitoring loop
        asyncio.run(monitor.start_monitoring())
    except KeyboardInterrupt:
        asyncio.run(monitor.stop_monitoring())
    finally:
        # Clean up hooks
        keyboard.unhook_all()
        mouse.unhook_all() 