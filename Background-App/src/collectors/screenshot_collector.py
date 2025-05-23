import os
import time
import logging
import mss
import mss.tools
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
from ..utils.database import LocalDatabase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/screenshots.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScreenshotCollector:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db = LocalDatabase()
        self.screenshot_dir = Path('data/screenshots') / user_id
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        self.last_screenshot_time = 0
        self.screenshot_interval = 300  # 5 minutes
        logger.info(f"Screenshot collector initialized for user {user_id}")

    def capture_screenshot(self) -> Optional[Dict]:
        """Capture a screenshot if enough time has passed since the last one."""
        current_time = time.time()
        
        # Check if enough time has passed
        if current_time - self.last_screenshot_time < self.screenshot_interval:
            return None

        try:
            # Create timestamp for filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"screenshot_{timestamp}.png"
            filepath = self.screenshot_dir / filename

            # Capture screenshot
            with mss.mss() as sct:
                # Robust monitor selection
                if len(sct.monitors) > 1:
                    monitor = sct.monitors[1]
                elif len(sct.monitors) == 1:
                    monitor = sct.monitors[0]
                else:
                    raise Exception("No monitors found for screenshot capture")
                screenshot = sct.grab(monitor)
                mss.tools.to_png(screenshot.rgb, screenshot.size, output=str(filepath))

            # Create screenshot data
            screenshot_data = {
                "user_id": self.user_id,
                "filename": filename,
                "filepath": str(filepath),
                "timestamp": datetime.now().isoformat(),
                "monitor": monitor,
                "size": screenshot.size
            }

            # Store in local database
            self.db.insert_screenshot(self.user_id, str(filepath))
            
            # Update last screenshot time
            self.last_screenshot_time = current_time

            logger.info(f"Screenshot captured: {filename}")
            return screenshot_data

        except Exception as e:
            logger.error(f"Error capturing screenshot: {str(e)}")
            raise  # Re-raise the exception for error handling tests

    def get_recent_screenshots(self, limit: int = 10) -> list:
        """Get list of recent screenshots."""
        try:
            screenshots = []
            for file in sorted(self.screenshot_dir.glob("*.png"), reverse=True)[:limit]:
                screenshots.append(str(file))  # Return file paths as strings
            return screenshots
        except Exception as e:
            logger.error(f"Error getting recent screenshots: {str(e)}")
            return []

    def cleanup_old_screenshots(self, days: int = 7) -> None:
        """Clean up screenshots older than specified days."""
        try:
            self.db.delete_old_media("screenshots", str(self.screenshot_dir), days)
            logger.info(f"Cleaned up screenshots older than {days} days")
        except Exception as e:
            logger.error(f"Error cleaning up screenshots: {str(e)}")
            raise  # Re-raise the exception for error handling tests

    def close(self) -> None:
        """Close the database connection."""
        try:
            self.db.close()
            logger.info("Screenshot collector closed")
        except Exception as e:
            logger.error(f"Error closing screenshot collector: {str(e)}") 