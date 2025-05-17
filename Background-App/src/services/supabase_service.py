import os
import logging
from datetime import datetime
from supabase import create_client, Client
from src.utils.config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    BATCH_SIZE,
    MAX_RETRIES,
    RETRY_DELAY
)

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase credentials not found in environment variables")
        
        try:
            self.supabase: Client = create_client(
                supabase_url=SUPABASE_URL,
                supabase_key=SUPABASE_KEY
            )
            # Initialize tables if they don't exist
            self._init_tables()
            logger.info("Successfully connected to Supabase")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {str(e)}")
            raise

    def _init_tables(self):
        """Initialize required tables if they don't exist."""
        try:
            # Check if tables exist
            try:
                self.supabase.table('screenshots').select('id').limit(1).execute()
                logger.info("Screenshots table exists")
            except:
                logger.error("Screenshots table does not exist. Please run init_tables.sql in the Supabase SQL editor.")
                raise
            
            try:
                self.supabase.table('activity_logs').select('id').limit(1).execute()
                logger.info("Activity logs table exists")
            except:
                logger.error("Activity logs table does not exist. Please run init_tables.sql in the Supabase SQL editor.")
                raise
            
            try:
                self.supabase.table('settings').select('id').limit(1).execute()
                logger.info("Settings table exists")
            except:
                logger.error("Settings table does not exist. Please run init_tables.sql in the Supabase SQL editor.")
                raise
            
        except Exception as e:
            logger.error(f"Error checking tables: {str(e)}")
            raise ValueError("Please run init_tables.sql in the Supabase SQL editor to create the required tables.")

    def sync_screenshots(self, screenshots):
        """Sync screenshots to Supabase."""
        try:
            # Process in batches
            for i in range(0, len(screenshots), BATCH_SIZE):
                batch = screenshots[i:i + BATCH_SIZE]
                response = self.supabase.table('screenshots').insert(batch).execute()
                logger.info(f"Synced {len(batch)} screenshots")
            return True
        except Exception as e:
            logger.error(f"Failed to sync screenshots: {str(e)}")
            return False

    def sync_activity(self, activity_data):
        """Sync activity data to Supabase."""
        try:
            response = self.supabase.table('activity_logs').insert(activity_data).execute()
            logger.info(f"Synced activity data")
            return True
        except Exception as e:
            logger.error(f"Failed to sync activity data: {str(e)}")
            return False

    def get_user_settings(self, user_id):
        """Get user settings from Supabase."""
        try:
            response = self.supabase.table('settings').select('*').eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to get user settings: {str(e)}")
            return None

    def update_user_settings(self, user_id, settings):
        """Update user settings in Supabase."""
        try:
            response = self.supabase.table('settings').upsert({
                'user_id': user_id,
                **settings,
                'updated_at': datetime.utcnow().isoformat()
            }).execute()
            logger.info(f"Updated user settings for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update user settings: {str(e)}")
            return False 