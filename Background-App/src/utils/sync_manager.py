import logging
from datetime import datetime
from typing import Dict, List, Any
from supabase import create_client, Client
from .sqlite_manager import SQLiteManager

logger = logging.getLogger(__name__)

class SyncManager:
    def __init__(self, supabase_url: str, supabase_key: str, sqlite_manager: SQLiteManager):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.sqlite = sqlite_manager
        
    async def sync_data(self):
        """Synchronize local data with Supabase."""
        try:
            # Get all unsynced data
            unsynced_data = self.sqlite.get_unsynced_data()
            
            # Sync time entries
            await self._sync_time_entries(unsynced_data['time_entries'])
            
            # Sync activity logs
            await self._sync_activity_logs(unsynced_data['activity_logs'])
            
            # Sync screenshots
            await self._sync_screenshots(unsynced_data['screenshots'])
            
            logger.info("Data synchronization completed successfully")
        except Exception as e:
            logger.error(f"Error during data synchronization: {e}")
            raise

    async def _sync_time_entries(self, time_entries: List[Dict[str, Any]]):
        """Sync time entries with Supabase."""
        try:
            for entry in time_entries:
                # Convert SQLite data to Supabase format
                supabase_entry = {
                    'id': entry[0],  # Assuming first column is id
                    'user_id': entry[1],
                    'task_id': entry[2],
                    'start_time': entry[3],
                    'end_time': entry[4],
                    'duration': entry[5],
                    'status': entry[6],
                    'created_at': entry[7]
                }
                
                # Insert into Supabase
                await self.supabase.table('time_entries').insert(supabase_entry).execute()
                
                # Mark as synced in SQLite
                self.sqlite.mark_as_synced('local_time_entries', entry[0])
                
        except Exception as e:
            logger.error(f"Error syncing time entries: {e}")
            raise

    async def _sync_activity_logs(self, activity_logs: List[Dict[str, Any]]):
        """Sync activity logs with Supabase."""
        try:
            for log in activity_logs:
                # Convert SQLite data to Supabase format
                supabase_log = {
                    'id': log[0],
                    'user_id': log[1],
                    'time_entry_id': log[2],
                    'app_name': log[3],
                    'window_title': log[4],
                    'activity_type': log[5],
                    'keystroke_count': log[6],
                    'mouse_events': log[7],
                    'idle_time': log[8],
                    'created_at': log[9]
                }
                
                # Insert into Supabase
                await self.supabase.table('activity_logs').insert(supabase_log).execute()
                
                # Mark as synced in SQLite
                self.sqlite.mark_as_synced('local_activity_logs', log[0])
                
        except Exception as e:
            logger.error(f"Error syncing activity logs: {e}")
            raise

    async def _sync_screenshots(self, screenshots: List[Dict[str, Any]]):
        """Sync screenshots with Supabase."""
        try:
            for screenshot in screenshots:
                # Upload file to Supabase Storage
                file_path = screenshot[3]  # Assuming local_file_path is 4th column
                with open(file_path, 'rb') as f:
                    file_name = f"screenshots/{screenshot[1]}/{screenshot[0]}.png"  # user_id/screenshot_id.png
                    await self.supabase.storage.from_('screenshots').upload(file_name, f)
                    
                # Create database record
                supabase_screenshot = {
                    'id': screenshot[0],
                    'user_id': screenshot[1],
                    'time_entry_id': screenshot[2],
                    'storage_path': file_name,
                    'created_at': screenshot[6]
                }
                
                # Insert into Supabase
                await self.supabase.table('screenshots').insert(supabase_screenshot).execute()
                
                # Mark as synced in SQLite
                self.sqlite.mark_as_synced('local_screenshots', screenshot[0])
                
        except Exception as e:
            logger.error(f"Error syncing screenshots: {e}")
            raise

    async def sync_settings(self, user_id: str):
        """Sync user settings from Supabase to local SQLite."""
        try:
            # Get settings from Supabase
            response = await self.supabase.from_('profiles').select('*').eq('id', user_id).single().execute()
            user_settings = response.data
            
            if user_settings:
                # Store relevant settings locally
                self.sqlite.set_setting('user_id', user_id)
                self.sqlite.set_setting('role', user_settings.get('role'))
                self.sqlite.set_setting('email', user_settings.get('email'))
                
            logger.info("Settings synchronized successfully")
        except Exception as e:
            logger.error(f"Error syncing settings: {e}")
            raise 