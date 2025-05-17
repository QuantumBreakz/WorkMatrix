import os
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
import json
from supabase import create_client, Client
from src.utils.config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    SCREENSHOTS_DIR,
    MAX_RETRIES,
    RETRY_DELAY,
    API_CALLS_PER_SYNC
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseSync:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.last_sync = self._load_last_sync()
        self.api_calls_today = self._load_api_calls()
        
    def _load_last_sync(self) -> datetime:
        try:
            with open("last_sync.json", "r") as f:
                data = json.load(f)
                return datetime.fromisoformat(data["timestamp"])
        except (FileNotFoundError, json.JSONDecodeError):
            return datetime.min
            
    def _save_last_sync(self):
        with open("last_sync.json", "w") as f:
            json.dump({"timestamp": datetime.now().isoformat()}, f)
            
    def _load_api_calls(self) -> int:
        try:
            with open("api_calls.json", "r") as f:
                data = json.load(f)
                if data["date"] == datetime.now().date().isoformat():
                    return data["count"]
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        return 0
        
    def _save_api_calls(self):
        with open("api_calls.json", "w") as f:
            json.dump({
                "date": datetime.now().date().isoformat(),
                "count": self.api_calls_today
            }, f)
            
    def _check_api_limits(self) -> bool:
        if self.api_calls_today + API_CALLS_PER_SYNC > 1500:  # Conservative daily limit
            logger.warning("API call limit reached for today")
            return False
        return True
        
    def _increment_api_calls(self):
        self.api_calls_today += 1
        self._save_api_calls()
        
    def sync_data(self):
        if not self._check_api_limits():
            return
            
        current_time = datetime.now()
        if current_time - self.last_sync < timedelta(days=1):
            logger.info("Skipping sync - last sync was less than 24 hours ago")
            return
            
        try:
            self._sync_screenshots()
            self._sync_activity_logs()
            self._sync_daily_hours()
            
            self.last_sync = current_time
            self._save_last_sync()
            logger.info("Sync completed successfully")
            
        except Exception as e:
            logger.error(f"Sync failed: {str(e)}")
            
    def _sync_screenshots(self):
        logger.info("Starting screenshot sync process...")
        if not self.user_id:
            logger.warning("User ID not set, skipping screenshot sync.")
            return

        # Ensure sqlite_db is an instance of SQLiteManager
        # This assumes sqlite_manager.py is updated with get_unsynced_screenshots_for_user 
        # and update_screenshot_sync_details as discussed.
        if not hasattr(self.sqlite_db, 'get_unsynced_screenshots_for_user') or \
           not hasattr(self.sqlite_db, 'update_screenshot_sync_details') or \
           not hasattr(self.sqlite_db, 'delete_screenshot_record_and_file'):
            logger.error("SQLiteManager is missing required methods for screenshot sync. Please update it.")
            return

        screenshots_to_sync = self.sqlite_db.get_unsynced_screenshots_for_user(self.user_id)

        if not screenshots_to_sync:
            logger.info("No new screenshots to sync.")
            return

        logger.info(f"Found {len(screenshots_to_sync)} screenshots to sync.")
        bucket_name = "user-captures" # Or your chosen bucket name

        for record in screenshots_to_sync:
            if not self._check_api_limits(): # Assuming this checks generic API call count
                logger.warning("API call limit possibly reached, pausing screenshot sync.")
                break
            
            local_file_path_str = record.get('local_file_path')
            screenshot_id = record.get('id')

            if not local_file_path_str or not screenshot_id:
                logger.error(f"Skipping record due to missing local_file_path or id: {record}")
                continue
            
            local_file = Path(local_file_path_str)
            if not local_file.exists():
                logger.warning(f"Local screenshot file not found: {local_file_path_str}. Skipping and marking as error or deleting record.")
                # Optionally, delete the orphaned DB record here if the file is truly gone
                # self.sqlite_db.delete_screenshot_record_and_file(screenshot_id, None) 
                continue

            # Define the path in Supabase Storage
            # Using user_id/screenshot_id.webp to ensure uniqueness and organization
            supabase_file_path = f"{self.user_id}/{screenshot_id}.webp"

            for attempt in range(MAX_RETRIES):
                try:
                    logger.info(f"Attempting to upload {local_file} to {bucket_name}/{supabase_file_path}")
                    with open(local_file, "rb") as f:
                        # file_options for content type and potentially upsert behavior
                        file_options = {"content-type": "image/webp", "cacheControl": "3600", "upsert": False}
                        upload_response = self.supabase.storage.from_(bucket_name).upload(
                            path=supabase_file_path,
                            file=f,
                            file_options=file_options
                        )
                    self._increment_api_calls() # Count this as an API call

                    # upload_response from supabase-py v1.x returns data on success, error on failure
                    # For supabase-py v2.x, it might raise an exception on failure directly or response structure might differ.
                    # Assuming supabase-py v1 style for now. Adjust if using v2.
                    # if upload_response.get('error'): # Check if there was an error object
                    #    raise Exception(str(upload_response['error']))
                    # If no error, proceed. The actual path is supabase_file_path we defined.

                    logger.info(f"Successfully uploaded {supabase_file_path}")

                    # Option 1: Store the simple path. Frontend can construct full URL if needed.
                    # public_url_data = self.supabase.storage.from_(bucket_name).get_public_url(supabase_file_path)
                    # stored_path_for_db = public_url_data.public_url 
                    # self._increment_api_calls() # If get_public_url is an API call
                    
                    # Option 2: Store the relative path used for upload. Simpler.
                    stored_path_for_db = supabase_file_path

                    # Update local SQLite DB with the Supabase storage path
                    self.sqlite_db.update_screenshot_sync_details(screenshot_id, stored_path_for_db)
                    logger.info(f"Updated local DB for screenshot {screenshot_id} with path: {stored_path_for_db}")

                    # Delete local file after successful upload and DB update
                    try:
                        local_file.unlink()
                        logger.info(f"Deleted local screenshot file: {local_file}")
                    except Exception as e_del:
                        logger.error(f"Error deleting local screenshot file {local_file}: {e_del}")
                    
                    break  # Success, break retry loop
                    
                except Exception as e:
                    logger.error(f"Attempt {attempt + 1}/{MAX_RETRIES} failed for screenshot {local_file_path_str}: {str(e)}")
                    if attempt == MAX_RETRIES - 1:
                        logger.error(f"All retries failed for screenshot {local_file_path_str}. It will be retried in the next sync cycle.")
                    else:
                        time.sleep(RETRY_DELAY)
        logger.info("Screenshot sync process finished.")
        
    def _sync_activity_logs(self):
        # Similar implementation for activity logs
        pass
        
    def _sync_daily_hours(self):
        # Similar implementation for daily hours
        pass 