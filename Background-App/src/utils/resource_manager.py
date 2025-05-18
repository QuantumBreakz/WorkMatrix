import os
import logging
import asyncio
from datetime import datetime, timedelta
from PIL import Image
import shutil
from typing import Optional
import aiofiles
import aiofiles.os

logger = logging.getLogger(__name__)

class ResourceManager:
    def __init__(self, 
                 base_dir: str,
                 max_storage_mb: int = 1000,  # 1GB default
                 max_file_age_days: int = 7,
                 compression_quality: int = 60):
        self.base_dir = base_dir
        self.screenshots_dir = os.path.join(base_dir, 'screenshots')
        self.max_storage_bytes = max_storage_mb * 1024 * 1024
        self.max_file_age = timedelta(days=max_file_age_days)
        self.compression_quality = compression_quality
        self._setup_directories()

    def _setup_directories(self):
        """Create necessary directories if they don't exist."""
        os.makedirs(self.screenshots_dir, exist_ok=True)

    async def save_screenshot(self, 
                            screenshot: Image.Image, 
                            user_id: str) -> Optional[str]:
        """Save and compress a screenshot, returning the file path if successful."""
        try:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{user_id}_{timestamp}.jpg"  # Using jpg for better compression
            filepath = os.path.join(self.screenshots_dir, filename)

            # Compress and save the image
            compressed = screenshot.convert('RGB')  # Convert to RGB for JPEG
            compressed.save(filepath, 
                          'JPEG', 
                          quality=self.compression_quality, 
                          optimize=True)

            # Check if we need to clean up old files
            await self._cleanup_if_needed()

            return filepath
        except Exception as e:
            logger.error(f"Error saving screenshot: {e}")
            return None

    async def _cleanup_if_needed(self):
        """Check storage usage and clean up old files if necessary."""
        try:
            total_size = 0
            files_info = []

            # Get all files and their info
            async for entry in aiofiles.os.scandir(self.screenshots_dir):
                if entry.is_file():
                    stats = await aiofiles.os.stat(entry.path)
                    total_size += stats.st_size
                    files_info.append({
                        'path': entry.path,
                        'size': stats.st_size,
                        'mtime': stats.st_mtime
                    })

            # If we're over the limit, start cleaning up
            if total_size > self.max_storage_bytes:
                # Sort files by modification time (oldest first)
                files_info.sort(key=lambda x: x['mtime'])
                
                # Remove files until we're under the limit
                for file_info in files_info:
                    if total_size <= self.max_storage_bytes:
                        break
                    try:
                        await aiofiles.os.remove(file_info['path'])
                        total_size -= file_info['size']
                        logger.info(f"Removed old file: {file_info['path']}")
                    except Exception as e:
                        logger.error(f"Error removing file {file_info['path']}: {e}")

        except Exception as e:
            logger.error(f"Error in cleanup: {e}")

    async def cleanup_old_files(self):
        """Remove files older than max_file_age."""
        try:
            cutoff_time = datetime.now() - self.max_file_age
            async for entry in aiofiles.os.scandir(self.screenshots_dir):
                if entry.is_file():
                    stats = await aiofiles.os.stat(entry.path)
                    if datetime.fromtimestamp(stats.st_mtime) < cutoff_time:
                        try:
                            await aiofiles.os.remove(entry.path)
                            logger.info(f"Removed expired file: {entry.path}")
                        except Exception as e:
                            logger.error(f"Error removing expired file {entry.path}: {e}")
        except Exception as e:
            logger.error(f"Error in old file cleanup: {e}")

    def get_storage_stats(self) -> dict:
        """Get current storage statistics."""
        total_size = 0
        file_count = 0
        
        for root, _, files in os.walk(self.screenshots_dir):
            for file in files:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
                file_count += 1

        return {
            'total_size_mb': total_size / (1024 * 1024),
            'file_count': file_count,
            'storage_limit_mb': self.max_storage_bytes / (1024 * 1024)
        }

    async def clear_all(self):
        """Clear all stored resources."""
        try:
            shutil.rmtree(self.screenshots_dir)
            self._setup_directories()
            logger.info("All resources cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing resources: {e}")
            raise 