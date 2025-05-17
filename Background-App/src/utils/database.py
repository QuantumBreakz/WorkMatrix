import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data/logs/workmatrix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseHandler:
    def __init__(self):
        load_dotenv()
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")
        
        try:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            # Verify connection
            self.supabase.table('screenshots').select('id').limit(1).execute()
            logger.info("Successfully connected to Supabase")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {str(e)}")
            raise

    def sync_screenshot(self, screenshot_data):
        try:
            response = self.supabase.table('screenshots').insert(screenshot_data).execute()
            logger.info(f"Successfully synced screenshot: {screenshot_data.get('filename')}")
            return response
        except Exception as e:
            logger.error(f"Failed to sync screenshot: {str(e)}")
            raise

    def sync_activity(self, activity_data):
        try:
            response = self.supabase.table('activity_logs').insert(activity_data).execute()
            logger.info(f"Successfully synced activity log")
            return response
        except Exception as e:
            logger.error(f"Failed to sync activity log: {str(e)}")
            raise

    def get_user_settings(self, user_id):
        try:
            response = self.supabase.table('settings').select('*').eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to get user settings: {str(e)}")
            raise

    def update_user_settings(self, user_id, settings):
        try:
            response = self.supabase.table('settings').upsert({
                'user_id': user_id,
                **settings
            }).execute()
            logger.info(f"Successfully updated user settings for user: {user_id}")
            return response
        except Exception as e:
            logger.error(f"Failed to update user settings: {str(e)}")
            raise

class LocalDatabase:
    def __init__(self, db_path: str = "workmatrix.db"):
        """Initialize the local database connection."""
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.initialize()

    def initialize(self):
        """Initialize the database and create tables if they don't exist."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            self._create_tables()
            logger.info("Local database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

    def _create_tables(self):
        """Create necessary tables if they don't exist."""
        self.cursor.executescript('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                activity_type TEXT NOT NULL,
                details TEXT,
                synced BOOLEAN DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                file_path TEXT NOT NULL,
                synced BOOLEAN DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS app_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                app_name TEXT NOT NULL,
                window_title TEXT,
                duration INTEGER,
                synced BOOLEAN DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS breaks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                break_type TEXT NOT NULL,
                synced BOOLEAN DEFAULT 0
            );
        ''')
        self.conn.commit()

    def insert_activity(self, user_id: str, activity_type: str, details: Optional[Dict] = None) -> int:
        """Insert a new activity log."""
        try:
            self.cursor.execute(
                "INSERT INTO activity_logs (user_id, timestamp, activity_type, details) VALUES (?, ?, ?, ?)",
                (user_id, datetime.now().isoformat(), activity_type, str(details) if details else None)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except Exception as e:
            logger.error(f"Error inserting activity: {str(e)}")
            raise

    def insert_screenshot(self, user_id: str, file_path: str) -> int:
        """Insert a new screenshot record."""
        try:
            self.cursor.execute(
                "INSERT INTO screenshots (user_id, timestamp, file_path) VALUES (?, ?, ?)",
                (user_id, datetime.now().isoformat(), file_path)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except Exception as e:
            logger.error(f"Error inserting screenshot: {str(e)}")
            raise

    def insert_app_usage(self, user_id: str, app_name: str, window_title: str, duration: int) -> int:
        """Insert a new app usage record."""
        try:
            self.cursor.execute(
                "INSERT INTO app_usage (user_id, timestamp, app_name, window_title, duration) VALUES (?, ?, ?, ?, ?)",
                (user_id, datetime.now().isoformat(), app_name, window_title, duration)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except Exception as e:
            logger.error(f"Error inserting app usage: {str(e)}")
            raise

    def insert_break(self, user_id: str, break_type: str) -> int:
        """Insert a new break record."""
        try:
            self.cursor.execute(
                "INSERT INTO breaks (user_id, start_time, break_type) VALUES (?, ?, ?)",
                (user_id, datetime.now().isoformat(), break_type)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except Exception as e:
            logger.error(f"Error inserting break: {str(e)}")
            raise

    def update_break_end(self, break_id: int):
        """Update the end time of a break."""
        try:
            self.cursor.execute(
                "UPDATE breaks SET end_time = ? WHERE id = ?",
                (datetime.now().isoformat(), break_id)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error updating break end time: {str(e)}")
            raise

    def get_unsynced_activities(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all unsynced activity logs for a user."""
        try:
            self.cursor.execute(
                "SELECT * FROM activity_logs WHERE user_id = ? AND synced = 0",
                (user_id,)
            )
            return [dict(zip([col[0] for col in self.cursor.description], row))
                   for row in self.cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting unsynced activities: {str(e)}")
            raise

    def get_unsynced_screenshots(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all unsynced screenshots for a user."""
        try:
            self.cursor.execute(
                "SELECT * FROM screenshots WHERE user_id = ? AND synced = 0",
                (user_id,)
            )
            return [dict(zip([col[0] for col in self.cursor.description], row))
                   for row in self.cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting unsynced screenshots: {str(e)}")
            raise

    def get_unsynced_app_usage(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all unsynced app usage records for a user."""
        try:
            self.cursor.execute(
                "SELECT * FROM app_usage WHERE user_id = ? AND synced = 0",
                (user_id,)
            )
            return [dict(zip([col[0] for col in self.cursor.description], row))
                   for row in self.cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting unsynced app usage: {str(e)}")
            raise

    def get_unsynced_breaks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all unsynced breaks for a user."""
        try:
            self.cursor.execute(
                "SELECT * FROM breaks WHERE user_id = ? AND synced = 0",
                (user_id,)
            )
            return [dict(zip([col[0] for col in self.cursor.description], row))
                   for row in self.cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting unsynced breaks: {str(e)}")
            raise

    def mark_activity_synced(self, activity_id: int):
        """Mark an activity log as synced."""
        try:
            self.cursor.execute(
                "UPDATE activity_logs SET synced = 1 WHERE id = ?",
                (activity_id,)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error marking activity as synced: {str(e)}")
            raise

    def mark_screenshot_synced(self, screenshot_id: int):
        """Mark a screenshot as synced."""
        try:
            self.cursor.execute(
                "UPDATE screenshots SET synced = 1 WHERE id = ?",
                (screenshot_id,)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error marking screenshot as synced: {str(e)}")
            raise

    def mark_app_usage_synced(self, app_usage_id: int):
        """Mark an app usage record as synced."""
        try:
            self.cursor.execute(
                "UPDATE app_usage SET synced = 1 WHERE id = ?",
                (app_usage_id,)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error marking app usage as synced: {str(e)}")
            raise

    def mark_break_synced(self, break_id: int):
        """Mark a break as synced."""
        try:
            self.cursor.execute(
                "UPDATE breaks SET synced = 1 WHERE id = ?",
                (break_id,)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error marking break as synced: {str(e)}")
            raise

    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed") 