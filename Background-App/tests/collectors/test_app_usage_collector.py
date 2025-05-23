import unittest
from unittest.mock import patch, MagicMock
import os
import platform
from datetime import datetime
from src.collectors.app_usage_collector import AppUsageCollector
import time

class TestAppUsageCollector(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test."""
        self.mock_db = MagicMock()
        self.user_id = "test_user"
        self.collector = AppUsageCollector(self.user_id, db=self.mock_db)
        self.collector.db = self.mock_db  # Ensure db is set

    def tearDown(self):
        """Clean up after each test."""
        try:
            self.collector.close()
        except Exception as e:
            print(f"Error in tearDown: {e}")

    @patch('platform.system')
    @patch('src.collectors.app_usage_collector.win32gui')
    @patch('src.collectors.app_usage_collector.win32process')
    @patch('psutil.Process')
    def test_get_active_window_windows(self, mock_psutil, mock_win32process, mock_win32gui, mock_system):
        """Test getting active window on Windows."""
        mock_system.return_value = "Windows"
        mock_win32gui.GetForegroundWindow.return_value = 1
        mock_win32gui.GetWindowText.return_value = "Test Window"
        mock_win32process.GetWindowThreadProcessId.return_value = (1, 1234)
        mock_proc = MagicMock()
        mock_proc.name.return_value = "TestApp"
        mock_proc.cpu_percent.return_value = 10
        mock_proc.memory_info.return_value = MagicMock(rss=1000)
        mock_psutil.return_value = mock_proc
        
        window_info = self.collector.get_active_window()
        self.assertEqual(window_info["window_title"], "Test Window")
        self.assertEqual(window_info["app_name"], "TestApp")

    @patch('platform.system')
    @patch('src.collectors.app_usage_collector.subprocess')
    @patch('psutil.Process')
    def test_get_active_window_linux(self, mock_psutil, mock_subprocess, mock_system):
        """Test getting active window on Linux."""
        mock_system.return_value = "Linux"
        mock_subprocess.check_output.side_effect = [
            b"1",  # window ID
            b"Test Window",  # window name
            b"1234"  # process ID
        ]
        mock_proc = MagicMock()
        mock_proc.name.return_value = "TestApp"
        mock_proc.cpu_percent.return_value = 10
        mock_proc.memory_info.return_value = MagicMock(rss=1000)
        mock_psutil.return_value = mock_proc
        
        window_info = self.collector.get_active_window()
        self.assertEqual(window_info["window_title"], "Test Window")
        self.assertEqual(window_info["app_name"], "TestApp")

    @patch('platform.system')
    @patch('src.collectors.app_usage_collector.NSWorkspace', create=True)
    def test_get_active_window_macos(self, mock_nsworkspace, mock_system):
        """Test getting active window on macOS."""
        mock_system.return_value = "Darwin"
        
        # Mock NSWorkspace and its methods
        mock_workspace = MagicMock()
        mock_nsworkspace.sharedWorkspace.return_value = mock_workspace
        mock_workspace.activeApplication.return_value = {
            'NSApplicationName': 'TestApp'
        }
        
        # Mock NSRunningApplication
        mock_running_app = MagicMock()
        mock_running_app.localizedName.return_value = "Test Window"
        mock_workspace.runningApplications.return_value = [mock_running_app]
        
        window_info = self.collector.get_active_window()
        self.assertEqual(window_info["window_title"], "TestApp")  # Should use app name as window title
        self.assertEqual(window_info["app_name"], "TestApp")

    def test_collect_app_usage(self):
        """Test collecting app usage data."""
        self.collector.current_app = "OldApp"
        self.collector.current_window = "Old Window"
        self.collector.start_time = time.time() - 60
        
        with patch.object(self.collector, 'get_active_window', return_value={
            "app_name": "NewApp",
            "window_title": "New Window",
            "cpu_usage": 10,
            "memory_usage": 1000
        }):
            result = self.collector.collect()
            self.mock_db.insert_app_usage.assert_called_once()
            self.assertEqual(result["app_name"], "NewApp")
            self.assertEqual(result["window_title"], "New Window")

    def test_error_handling(self):
        """Test error handling in app usage collection."""
        with patch.object(self.collector, 'get_active_window', side_effect=Exception("Test error")):
            with self.assertRaises(Exception) as context:
                self.collector.collect()
            self.assertIn("Test error", str(context.exception))

    def test_flush(self):
        """Test flushing remaining app usage data."""
        self.collector.current_app = "TestApp"
        self.collector.current_window = "Test Window"
        start_time = time.time() - 60
        self.collector.start_time = start_time
        
        self.collector.flush()
        self.mock_db.insert_app_usage.assert_called_once_with(
            user_id=self.user_id,
            timestamp=datetime.fromtimestamp(start_time).isoformat(),
            app_name="TestApp",
            window_title="Test Window",
            duration=60
        )

if __name__ == '__main__':
    unittest.main() 