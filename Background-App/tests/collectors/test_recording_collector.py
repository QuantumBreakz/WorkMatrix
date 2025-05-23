import unittest
from unittest.mock import patch, MagicMock, mock_open
import os
import time
from datetime import datetime, timedelta
from src.collectors.recording_collector import RecordingCollector, is_terminal_active
from src.utils.database import LocalDatabase

class TestRecordingCollector(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test."""
        self.user_id = "test_user"
        self.collector = RecordingCollector(self.user_id)
        self.test_dir = os.path.join("data", "recordings")
        os.makedirs(self.test_dir, exist_ok=True)

    def tearDown(self):
        """Clean up after each test."""
        self.collector.close()
        # Clean up test files
        for file in os.listdir(self.test_dir):
            os.remove(os.path.join(self.test_dir, file))
        os.rmdir(self.test_dir)

    @patch('src.collectors.recording_collector.is_terminal_active')
    def test_is_terminal_active(self, mock_is_terminal):
        """Test terminal activity detection."""
        # Test when terminal is active
        mock_is_terminal.return_value = True
        self.assertTrue(is_terminal_active())
        
        # Test when terminal is not active
        mock_is_terminal.return_value = False
        self.assertFalse(is_terminal_active())

    @patch('src.collectors.recording_collector.is_terminal_active', return_value=False)
    @patch('cv2.cvtColor', return_value=MagicMock())
    @patch('cv2.VideoWriter')
    @patch('pyautogui.screenshot')
    @patch('numpy.array')
    @patch('builtins.open', new_callable=mock_open)
    def test_capture_recording(self, mock_file, mock_array, mock_screenshot, mock_video_writer, mock_cvtColor, mock_is_terminal):
        """Test screen recording capture."""
        # Mock screen size
        mock_screenshot.return_value = MagicMock(size=(1920, 1080))
        
        # Mock video writer
        mock_writer = MagicMock()
        mock_video_writer.return_value = mock_writer
        
        # Mock numpy array
        mock_array.return_value = MagicMock()
        
        # Mock file operations
        mock_file.return_value.__enter__.return_value.write.return_value = None
        mock_file.return_value.__enter__.return_value.tell.return_value = 1024
        
        # Test recording capture
        result = self.collector.capture_recording()
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertEqual(result["user_id"], self.user_id)
        self.assertIn("timestamp", result)
        self.assertIn("file_path", result)
        self.assertEqual(result["file_size"], 1024)
        self.assertEqual(result["duration"], 5)  # Default duration
        
        # Verify video writer was used
        mock_video_writer.assert_called_once()
        mock_writer.write.assert_called()
        mock_writer.release.assert_called_once()

    @patch('src.collectors.recording_collector.is_terminal_active', return_value=False)
    @patch('cv2.VideoWriter')
    def test_error_handling(self, mock_video_writer, mock_is_terminal):
        """Test error handling in recording operations."""
        # Test video writer error
        mock_video_writer.side_effect = Exception("Video writer error")
        
        with self.assertRaises(Exception) as context:
            self.collector.capture_recording()
        self.assertIn("Video writer error", str(context.exception))

    def test_recording_cleanup(self):
        mock_cleanup = MagicMock()
        self.collector.sqlite_db.cleanup_old_media = mock_cleanup
        # Create some test files
        old_time = datetime.now() - timedelta(days=8)
        new_time = datetime.now() - timedelta(days=3)
        old_file = os.path.join(self.test_dir, f"recording_{old_time.strftime('%Y%m%d_%H%M%S')}.mp4")
        new_file = os.path.join(self.test_dir, f"recording_{new_time.strftime('%Y%m%d_%H%M%S')}.mp4")
        with open(old_file, 'w') as f:
            f.write("old recording")
        with open(new_file, 'w') as f:
            f.write("new recording")
        # Test cleanup
        self.collector.cleanup_old_recordings(days=7)
        # Verify cleanup was called
        expected_dir = os.path.join("data", "recordings")
        mock_cleanup.assert_called_once_with("recordings", expected_dir, 7)
        # Manually delete files for test cleanup
        if os.path.exists(old_file):
            os.remove(old_file)
        if os.path.exists(new_file):
            os.remove(new_file)

    def test_terminal_blocking(self):
        """Test that recording is blocked when terminal is active."""
        with patch('src.collectors.recording_collector.is_terminal_active', return_value=True):
            result = self.collector.capture_recording()
            self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main() 