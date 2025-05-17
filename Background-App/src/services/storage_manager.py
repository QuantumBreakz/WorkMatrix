import os
import logging
from datetime import datetime, timedelta
from pathlib import Path
from src.utils.config import (
    SCREENSHOTS_DIR,
    MAX_LOCAL_STORAGE,
    MAX_SCREENSHOTS,
    SCREENSHOT_MAX_SIZE
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StorageManager:
    def __init__(self):
        self.screenshots_dir = SCREENSHOTS_DIR
        self.max_storage = MAX_LOCAL_STORAGE
        self.max_screenshots = MAX_SCREENSHOTS
        self.max_size = SCREENSHOT_MAX_SIZE

    def cleanup_old_screenshots(self, days_to_keep: int = 30):
        """Delete screenshots older than specified days."""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        deleted_count = 0

        for screenshot in self.screenshots_dir.glob("*.jpg"):
            try:
                file_time = datetime.fromtimestamp(screenshot.stat().st_mtime)
                if file_time < cutoff_date:
                    screenshot.unlink()
                    deleted_count += 1
                    logger.info(f"Deleted old screenshot: {screenshot.name}")
            except Exception as e:
                logger.error(f"Error deleting {screenshot.name}: {str(e)}")

        logger.info(f"Cleaned up {deleted_count} old screenshots")
        return deleted_count

    def check_storage_usage(self) -> tuple[int, int]:
        """Check current storage usage and file count."""
        total_size = 0
        file_count = 0

        for screenshot in self.screenshots_dir.glob("*.jpg"):
            try:
                total_size += screenshot.stat().st_size
                file_count += 1
            except Exception as e:
                logger.error(f"Error checking {screenshot.name}: {str(e)}")

        return total_size, file_count

    def enforce_storage_limits(self):
        """Remove oldest files if storage limits are exceeded."""
        total_size, file_count = self.check_storage_usage()
        deleted_count = 0

        # Check if we need to delete files
        while (total_size > self.max_storage * 0.9 or  # 90% of max storage
               file_count > self.max_screenshots):
            # Get oldest file
            oldest_file = min(
                self.screenshots_dir.glob("*.jpg"),
                key=lambda x: x.stat().st_mtime,
                default=None
            )

            if not oldest_file:
                break

            try:
                file_size = oldest_file.stat().st_size
                oldest_file.unlink()
                total_size -= file_size
                file_count -= 1
                deleted_count += 1
                logger.info(f"Deleted oldest screenshot: {oldest_file.name}")
            except Exception as e:
                logger.error(f"Error deleting {oldest_file.name}: {str(e)}")
                break

        if deleted_count > 0:
            logger.info(f"Enforced storage limits: deleted {deleted_count} files")
        return deleted_count

    def compress_large_screenshots(self):
        """Compress screenshots that exceed size limit."""
        from PIL import Image
        import io

        compressed_count = 0
        for screenshot in self.screenshots_dir.glob("*.jpg"):
            try:
                if screenshot.stat().st_size > self.max_size:
                    # Open and compress image
                    with Image.open(screenshot) as img:
                        # Convert to RGB if needed
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        
                        # Save with compression
                        img.save(
                            screenshot,
                            'JPEG',
                            quality=60,
                            optimize=True
                        )
                    compressed_count += 1
                    logger.info(f"Compressed screenshot: {screenshot.name}")
            except Exception as e:
                logger.error(f"Error compressing {screenshot.name}: {str(e)}")

        if compressed_count > 0:
            logger.info(f"Compressed {compressed_count} screenshots")
        return compressed_count 