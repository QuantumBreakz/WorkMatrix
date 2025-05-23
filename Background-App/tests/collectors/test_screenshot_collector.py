import unittest
from unittest.mock import patch, MagicMock, mock_open
import os
import time
from datetime import datetime, timedelta
from src.collectors.screenshot_collector import ScreenshotCollector
from src.utils.database import LocalDatabase
import logging

logger = logging.getLogger(__name__)

class TestScreenshotCollector(unittest.TestCase):
    def setUp(self):
        self.user_id = "test_user"
        self.collector = ScreenshotCollector(self.user_id)
        self.test_dir = os.path.join("data", "screenshots", self.user_id)
        os.makedirs(self.test_dir, exist_ok=True)

    def tearDown(self):
        self.collector.close()
        # Clean up test files
        try:
            for file in os.listdir(self.test_dir):
                file_path = os.path.join(self.test_dir, file)
                try:
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                except Exception as e:
                    logger.error(f"Error deleting {file_path}: {e}")
            os.rmdir(self.test_dir)
            os.rmdir(os.path.dirname(self.test_dir))  # Remove screenshots directory
        except Exception as e:
            logger.error(f"Error in tearDown: {e}")

    @patch('mss.mss')
    @patch('mss.tools.to_png')
    @patch('builtins.open', new_callable=mock_open)
    def test_capture_screenshot(self, mock_file, mock_to_png, mock_mss):
        # Mock MSS instance
        mock_mss_instance = MagicMock()
        mock_mss.return_value.__enter__.return_value = mock_mss_instance
        
        # Mock monitor info
        mock_mss_instance.monitors = [
            {'left': 0, 'top': 0, 'width': 1920, 'height': 1080},  # all monitors (dummy)
            {'left': 0, 'top': 0, 'width': 1920, 'height': 1080}   # primary monitor
        ]
        
        # Mock screenshot data
        mock_screenshot = MagicMock()
        mock_screenshot.rgb = b'fake_image_data'
        mock_screenshot.size = (1920, 1080)  # Set a realistic size
        mock_mss_instance.grab.return_value = mock_screenshot
        
        # Mock PNG conversion
        mock_to_png.return_value = b'fake_png_data'
        
        # Mock file operations
        mock_file.return_value.__enter__.return_value.write.return_value = None
        
        # Test screenshot capture
        result = self.collector.capture_screenshot()
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertEqual(result["user_id"], self.user_id)
        self.assertIn("filename", result)
        self.assertIn("filepath", result)
        self.assertIn("timestamp", result)
        self.assertEqual(result["size"], (1920, 1080))  # Check against mocked size
        
        # Test immediate subsequent capture returns None
        result2 = self.collector.capture_screenshot()
        self.assertIsNone(result2)
        
        # Test capture after wait returns valid data
        time.sleep(1)  # Wait for cooldown
        self.collector.last_screenshot_time = time.time() - self.collector.screenshot_interval
        result3 = self.collector.capture_screenshot()
        self.assertIsNotNone(result3)

        # Verify mss.tools.to_png was called twice
        self.assertEqual(mock_to_png.call_count, 2)

    @patch.object(LocalDatabase, 'delete_old_media')
    def test_cleanup_old_screenshots(self, mock_cleanup):
        # Create some test files
        old_time = datetime.now() - timedelta(days=8)
        new_time = datetime.now() - timedelta(days=3)
        
        old_file = os.path.join(self.test_dir, f"screenshot_{old_time.strftime('%Y%m%d_%H%M%S')}.png")
        new_file = os.path.join(self.test_dir, f"screenshot_{new_time.strftime('%Y%m%d_%H%M%S')}.png")
        
        with open(old_file, 'w') as f:
            f.write("old screenshot")
        with open(new_file, 'w') as f:
            f.write("new screenshot")
        
        # Test cleanup
        self.collector.cleanup_old_screenshots(days=7)
        
        # Verify cleanup was called
        mock_cleanup.assert_called_once_with("screenshots", self.test_dir, 7)
        
        # Manually delete files for test cleanup
        if os.path.exists(old_file):
            os.remove(old_file)
        if os.path.exists(new_file):
            os.remove(new_file)

    @patch('mss.mss')
    def test_error_handling(self, mock_mss):
        # Test MSS error
        mock_mss.side_effect = Exception("Screenshot capture error")
        
        with self.assertRaises(Exception) as context:
            self.collector.capture_screenshot()
        self.assertIn("Screenshot capture error", str(context.exception))

    def test_get_recent_screenshots(self):
        # Create some test files
        now = datetime.now()
        files = []
        for i in range(5):
            timestamp = now - timedelta(minutes=i)
            filename = f"screenshot_{timestamp.strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join(self.test_dir, filename)
            with open(filepath, 'w') as f:
                f.write(f"test screenshot {i}")
            files.append(filepath)
        
        # Test getting recent screenshots
        recent = self.collector.get_recent_screenshots(limit=3)
        
        # Verify results
        self.assertEqual(len(recent), 3)
        self.assertTrue(all(os.path.exists(f) for f in recent))
        
        # Clean up test files
        for file in files:
            os.remove(file)

if __name__ == '__main__':
    unittest.main() 