import os
import sys
import time
import asyncio
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import schedule
from loguru import logger
from monitor import ActivityMonitor
from config import SUPABASE_URL, SUPABASE_KEY, LOG_DIR

# Add the project root directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from src.collectors.screenshot_collector import ScreenshotCollector
from src.collectors.activity_collector import ActivityCollector
from src.collectors.app_usage_collector import AppUsageCollector
from src.services.storage_manager import StorageManager
from src.services.supabase_sync import SupabaseSync
from src.services.monitor_api import APIMonitor
from src.utils.config import (
    SCREENSHOT_INTERVAL,
    KEYSTROKE_INTERVAL,
    SYNC_INTERVAL,
    LOGS_DIR,
    LOG_LEVEL,
    LOG_FORMAT,
    MAX_STORAGE_MB
)

# Load environment variables
load_dotenv()

# Configure logging
def setup_logging():
    # Create logs directory if it doesn't exist
    os.makedirs('data/logs', exist_ok=True)
    
    # Configure root logger
    logger.remove()
    logger.add(
        os.path.join(LOG_DIR, "workmatrix_{time}.log"),
        rotation="1 day",
        retention="7 days",
        level="INFO"
    )
    logger.add(sys.stderr, level="INFO")
    
    return logger

# Get logger
logger = setup_logging()

class WorkMatrixApp:
    def __init__(self):
        self.user_id = os.getenv("USER_ID")
        self.screenshot_collector = ScreenshotCollector(self.user_id)
        self.activity_collector = ActivityCollector(self.user_id)
        # If you have a RecordingCollector, add it here as well
        # self.recording_collector = RecordingCollector(self.user_id)
        # Update SupabaseSync to use user_id
        self.sync_service = SupabaseSync(self.user_id)
        self.is_running = False

    def start(self):
        """
        Start the WorkMatrix monitoring application.
        """
        try:
            logger.info("Starting WorkMatrix monitoring application...")
            self.is_running = True

            # Schedule tasks
            schedule.every(SCREENSHOT_INTERVAL).seconds.do(self.capture_screenshot)
            schedule.every(KEYSTROKE_INTERVAL).seconds.do(self.collect_activity)
            schedule.every(SYNC_INTERVAL).seconds.do(self.sync_data)
            schedule.every(1).days.do(self.cleanup_data)

            # Run the scheduler
            while self.is_running:
                schedule.run_pending()
                time.sleep(1)

        except Exception as e:
            logger.error(f"Error in main application: {str(e)}")
            self.stop()

    def stop(self):
        """
        Stop the WorkMatrix monitoring application.
        """
        logger.info("Stopping WorkMatrix monitoring application...")
        self.is_running = False
        # Perform final sync before stopping
        self.sync_data()

    def capture_screenshot(self):
        """
        Capture and store a screenshot.
        """
        try:
            screenshot_data = self.screenshot_collector.capture_screenshot()
            if screenshot_data:
                logger.info(f"Captured screenshot: {screenshot_data['id']}")
        except Exception as e:
            logger.error(f"Error capturing screenshot: {str(e)}")

    def collect_activity(self):
        """
        Collect and store activity data.
        """
        try:
            activity_data = self.activity_collector.collect_activity()
            if activity_data:
                logger.info("Collected activity data")
        except Exception as e:
            logger.error(f"Error collecting activity: {str(e)}")

    def sync_data(self):
        """
        Sync collected data to Supabase.
        """
        try:
            self.sync_service.sync_counts()
            self.sync_service.sync_other_data()
            logger.info("Synced data to Supabase")
        except Exception as e:
            logger.error(f"Error syncing data: {str(e)}")

    def cleanup_data(self):
        """
        Clean up old data to stay within storage limits.
        """
        try:
            # Optionally add local cleanup logic here
            logger.info("Cleaned up old data")
        except Exception as e:
            logger.error(f"Error cleaning up data: {str(e)}")

async def main():
    """Main entry point for the background monitoring application."""
    try:
        # Validate configuration
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing Supabase configuration. Please check your .env file.")

        # Get user credentials
        user_id = input("Please enter your user ID: ").strip()
        if not user_id:
            raise ValueError("User ID is required.")

        logger.info(f"Starting WorkMatrix monitoring for user: {user_id}")
        
        # Initialize and start monitoring
        monitor = ActivityMonitor(SUPABASE_URL, SUPABASE_KEY, user_id)
        await monitor.start_monitoring()

    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user.")
    except Exception as e:
        logger.error(f"Error in main: {e}")
        raise
    finally:
        logger.info("WorkMatrix monitoring stopped.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1) 