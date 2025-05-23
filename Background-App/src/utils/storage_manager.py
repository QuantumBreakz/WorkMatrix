import os
import logging
from datetime import datetime, timedelta
from pathlib import Path
from PIL import Image
import io

logger = logging.getLogger(__name__)

class StorageManager:
    def __init__(self, base_dir: str = "screenshots"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        self.max_storage_mb = 500  # 500MB limit
        self.compression_threshold_kb = 500  # Compress if > 500KB
        self.compression_quality = 50  # 50% quality for compression

    def compress_screenshot(self, image_data: bytes) -> bytes:
        """Compress screenshot if it exceeds size threshold."""
        try:
            # Check if compression is needed
            if len(image_data) <= self.compression_threshold_kb * 1024:
                return image_data

            # Open image and compress
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Compress with quality setting
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=self.compression_quality, optimize=True)
            compressed_data = output.getvalue()
            
            # Log compression results
            original_size = len(image_data) / 1024
            compressed_size = len(compressed_data) / 1024
            reduction = ((original_size - compressed_size) / original_size) * 100
            
            logger.info(f"Compressed screenshot: {original_size:.1f}KB -> {compressed_size:.1f}KB ({reduction:.1f}% reduction)")
            
            return compressed_data

        except Exception as e:
            logger.error(f"Error compressing screenshot: {str(e)}")
            return image_data

    def save_screenshot(self, image_data: bytes, filename: str) -> bool:
        """Save screenshot with compression if needed."""
        try:
            # Compress if needed
            compressed_data = self.compress_screenshot(image_data)
            
            # Save to file
            filepath = self.base_dir / filename
            with open(filepath, 'wb') as f:
                f.write(compressed_data)
            
            return True

        except Exception as e:
            logger.error(f"Error saving screenshot: {str(e)}")
            return False

    def cleanup_old_screenshots(self, days: int = 30):
        """Remove screenshots older than specified days."""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            deleted_count = 0
            total_size = 0

            for file in self.base_dir.glob('*.jpg'):
                try:
                    # Get file creation time
                    creation_time = datetime.fromtimestamp(file.stat().st_ctime)
                    
                    if creation_time < cutoff_date:
                        # Get file size before deletion
                        size = file.stat().st_size
                        file.unlink()
                        deleted_count += 1
                        total_size += size
                        logger.info(f"Deleted old screenshot: {file.name}")
                except Exception as e:
                    logger.error(f"Error deleting {file.name}: {str(e)}")

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old screenshots, freed {total_size/1024/1024:.1f}MB")

        except Exception as e:
            logger.error(f"Error cleaning up old screenshots: {str(e)}")

    def get_storage_usage(self) -> dict:
        """Get current storage usage."""
        try:
            total_size = 0
            file_count = 0

            for file in self.base_dir.glob('*.jpg'):
                total_size += file.stat().st_size
                file_count += 1

            return {
                "total_size_mb": total_size / (1024 * 1024),
                "file_count": file_count,
                "last_check": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting storage usage: {str(e)}")
            return {"total_size_mb": 0, "file_count": 0, "last_check": datetime.now().isoformat()}

    def enforce_storage_limit(self) -> bool:
        """Ensure storage usage is within limits."""
        try:
            usage = self.get_storage_usage()
            
            if usage["total_size_mb"] > self.max_storage_mb:
                logger.warning(f"Storage limit exceeded: {usage['total_size_mb']:.1f}MB > {self.max_storage_mb}MB")
                self.cleanup_old_screenshots()
                return False
            
            return True

        except Exception as e:
            logger.error(f"Error enforcing storage limit: {str(e)}")
            return False 