import sqlite3
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SQLiteManager:
    def __init__(self, db_path="workmatrix.db"):
        self.db_path = db_path
        self.initialize_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def initialize_db(self):
        """Initialize the database with the new schema."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Create local cache tables
                cursor.executescript("""
                    -- Local Time Entries
                    CREATE TABLE IF NOT EXISTS local_time_entries (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        task_id TEXT,
                        start_time TEXT NOT NULL,
                        end_time TEXT,
                        duration INTEGER,
                        status TEXT DEFAULT 'active',
                        is_synced INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Local Activity Logs
                    CREATE TABLE IF NOT EXISTS local_activity_logs (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        time_entry_id TEXT,
                        app_name TEXT NOT NULL,
                        window_title TEXT,
                        activity_type TEXT NOT NULL,
                        keystroke_count INTEGER DEFAULT 0,
                        mouse_events INTEGER DEFAULT 0,
                        idle_time INTEGER DEFAULT 0,
                        is_synced INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Local Screenshots
                    CREATE TABLE IF NOT EXISTS local_screenshots (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        time_entry_id TEXT,
                        local_file_path TEXT NOT NULL,
                        storage_path TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Local Recordings
                    CREATE TABLE IF NOT EXISTS local_recordings (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        time_entry_id TEXT,
                        local_file_path TEXT NOT NULL,
                        storage_path TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Local Settings
                    CREATE TABLE IF NOT EXISTS local_settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Create indexes for better performance
                    CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON local_time_entries(user_id);
                    CREATE INDEX IF NOT EXISTS idx_time_entries_sync ON local_time_entries(is_synced);
                    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON local_activity_logs(user_id);
                    CREATE INDEX IF NOT EXISTS idx_activity_logs_sync ON local_activity_logs(is_synced);
                    CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON local_screenshots(user_id);
                    CREATE INDEX IF NOT EXISTS idx_screenshots_sync ON local_screenshots(is_synced);
                    CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON local_recordings(user_id);
                    CREATE INDEX IF NOT EXISTS idx_recordings_sync ON local_recordings(is_synced);
                """)
                
                logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise

    def insert_time_entry(self, user_id, task_id=None):
        """Insert a new time entry."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                entry_id = f"te_{datetime.now().timestamp()}"
                cursor.execute("""
                    INSERT INTO local_time_entries (id, user_id, task_id, start_time)
                    VALUES (?, ?, ?, datetime('now'))
                """, (entry_id, user_id, task_id))
                return entry_id
        except Exception as e:
            logger.error(f"Error inserting time entry: {e}")
            raise

    def update_time_entry(self, entry_id, end_time=None, duration=None):
        """Update an existing time entry."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                if end_time:
                    cursor.execute("""
                        UPDATE local_time_entries
                        SET end_time = ?, duration = ?, status = 'completed'
                        WHERE id = ?
                    """, (end_time, duration, entry_id))
        except Exception as e:
            logger.error(f"Error updating time entry: {e}")
            raise

    def insert_activity_log(self, user_id, time_entry_id, app_name, window_title, 
                          activity_type, keystroke_count=0, mouse_events=0, idle_time=0):
        """Insert a new activity log."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                log_id = f"al_{datetime.now().timestamp()}"
                cursor.execute("""
                    INSERT INTO local_activity_logs 
                    (id, user_id, time_entry_id, app_name, window_title, 
                     activity_type, keystroke_count, mouse_events, idle_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (log_id, user_id, time_entry_id, app_name, window_title, 
                      activity_type, keystroke_count, mouse_events, idle_time))
                return log_id
        except Exception as e:
            logger.error(f"Error inserting activity log: {e}")
            raise

    def insert_screenshot(self, user_id, time_entry_id, local_file_path):
        """Insert a new screenshot record."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                screenshot_id = f"ss_{datetime.now().timestamp()}"
                cursor.execute("""
                    INSERT INTO local_screenshots 
                    (id, user_id, time_entry_id, local_file_path)
                    VALUES (?, ?, ?, ?)
                """, (screenshot_id, user_id, time_entry_id, local_file_path))
                return screenshot_id
        except Exception as e:
            logger.error(f"Error inserting screenshot: {e}")
            raise

    def get_unsynced_data(self):
        """Get all unsynced data for synchronization."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get unsynced time entries
                cursor.execute("SELECT * FROM local_time_entries WHERE is_synced = 0")
                time_entries = cursor.fetchall()
                
                # Get unsynced activity logs
                cursor.execute("SELECT * FROM local_activity_logs WHERE is_synced = 0")
                activity_logs = cursor.fetchall()
                
                # Get unsynced screenshots
                cursor.execute("SELECT * FROM local_screenshots WHERE is_synced = 0")
                screenshots = cursor.fetchall()
                
                return {
                    'time_entries': time_entries,
                    'activity_logs': activity_logs,
                    'screenshots': screenshots
                }
        except Exception as e:
            logger.error(f"Error getting unsynced data: {e}")
            raise

    def mark_as_synced(self, table_name, record_id):
        """Mark a record as synced."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f"""
                    UPDATE {table_name}
                    SET is_synced = 1
                    WHERE id = ?
                """, (record_id,))
        except Exception as e:
            logger.error(f"Error marking record as synced: {e}")
            raise

    def get_setting(self, key):
        """Get a setting value."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM local_settings WHERE key = ?", (key,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting setting: {e}")
            raise

    def set_setting(self, key, value):
        """Set a setting value."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO local_settings (key, value, updated_at)
                    VALUES (?, ?, datetime('now'))
                """, (key, value))
        except Exception as e:
            logger.error(f"Error setting setting: {e}")
            raise

    def cleanup_old_media(self, media_type: str, directory: str, days: int = 30):
        """Clean up old media files and their database records."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cutoff_date = datetime.now() - timedelta(days=days)
                
                # Get old media records
                if media_type == "screenshots":
                    cursor.execute("""
                        SELECT id, local_file_path FROM local_screenshots 
                        WHERE created_at < ?
                    """, (cutoff_date.isoformat(),))
                elif media_type == "recordings":
                    cursor.execute("""
                        SELECT id, local_file_path FROM local_recordings 
                        WHERE created_at < ?
                    """, (cutoff_date.isoformat(),))
                else:
                    raise ValueError(f"Unsupported media type: {media_type}")
                
                old_records = cursor.fetchall()
                
                # Delete files and records
                for record_id, file_path in old_records:
                    try:
                        # Delete file if it exists
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        
                        # Delete database record
                        if media_type == "screenshots":
                            cursor.execute("DELETE FROM local_screenshots WHERE id = ?", (record_id,))
                        else:
                            cursor.execute("DELETE FROM local_recordings WHERE id = ?", (record_id,))
                            
                    except Exception as e:
                        logger.error(f"Error cleaning up {media_type} {record_id}: {e}")
                        continue
                
                conn.commit()
                logger.info(f"Cleaned up {len(old_records)} old {media_type}")
                return len(old_records)
                
        except Exception as e:
            logger.error(f"Error cleaning up old {media_type}: {e}")
            raise

    def close(self):
        """Close the database connection if open (for compatibility with other DB classes)."""
        # This class uses context managers for connections, so nothing to close, but provide for API compatibility.
        pass 