import unittest
import os
import time
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from src.collectors.activity_collector import ActivityCollector

class TestActivityCollector(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test."""
        self.user_id = "test_user"
        self.collector = ActivityCollector(self.user_id, idle_threshold=2)  # 2 seconds for testing
        self.test_db_path = 'test_activity.db'
        
    def tearDown(self):
        """Clean up after each test."""
        if hasattr(self.collector, 'db'):
            self.collector.close()
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    @patch('src.collectors.activity_collector.win32gui')
    @patch('src.collectors.activity_collector.win32process')
    def test_get_active_window_info(self, mock_win32process, mock_win32gui):
        """Test getting active window information."""
        # Mock Windows API responses
        mock_win32gui.GetForegroundWindow.return_value = 123
        mock_win32gui.GetWindowText.return_value = "Test Window"
        mock_win32process.GetWindowThreadProcessId.return_value = (456, 789)
        
        # Mock psutil Process
        mock_process = MagicMock()
        mock_process.name.return_value = "test_app.exe"
        mock_process.cpu_percent.return_value = 5.0
        mock_process.memory_info.return_value = MagicMock(rss=1000000)
        
        with patch('psutil.Process', return_value=mock_process):
            info = self.collector.get_active_window_info()
            
            self.assertEqual(info["app_name"], "test_app.exe")
            self.assertEqual(info["window_title"], "Test Window")
            self.assertEqual(info["process_id"], 789)
            self.assertEqual(info["cpu_usage"], 5.0)
            self.assertEqual(info["memory_usage"], 1000000)
            self.assertIn("timestamp", info)

    def test_check_idle_state(self):
        """Test idle state detection."""
        # Initially not idle
        self.assertFalse(self.collector.is_idle)
        
        # Simulate idle
        time.sleep(3)  # Wait longer than idle_threshold
        self.assertTrue(self.collector.check_idle_state())
        
        # Simulate activity
        self.collector.last_activity_time = time.time()
        self.assertFalse(self.collector.check_idle_state())

    def test_collect_activity(self):
        """Test activity collection."""
        # Mock window info
        with patch.object(self.collector, 'get_active_window_info') as mock_info:
            mock_info.return_value = {
                "app_name": "test_app",
                "window_title": "Test Window",
                "process_id": 123,
                "cpu_usage": 5.0,
                "memory_usage": 1000000,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Mock database insert
            with patch.object(self.collector.db, 'insert_activity_log') as mock_insert:
                mock_insert.return_value = 1
                
                # First collection
                activity = self.collector.collect_activity()
                self.assertIsNotNone(activity)
                self.assertEqual(activity["app_name"], "test_app")
                self.assertEqual(activity["window_title"], "Test Window")
                
                # Verify database insert was called
                mock_insert.assert_called_once()
                
                # Same window, should return None
                activity = self.collector.collect_activity()
                self.assertIsNone(activity)
                
                # Different window
                mock_info.return_value["window_title"] = "New Window"
                activity = self.collector.collect_activity()
                self.assertIsNotNone(activity)
                self.assertEqual(activity["window_title"], "New Window")

    def test_get_activity_summary(self):
        """Test activity summary generation."""
        # Create test data
        start_time = datetime.utcnow() - timedelta(hours=1)
        end_time = datetime.utcnow()
        
        # Mock database response
        with patch.object(self.collector.db, 'get_activity_logs_between') as mock_get:
            mock_get.return_value = [
                {
                    "app_name": "app1",
                    "created_at": (start_time + timedelta(minutes=10)).isoformat()
                },
                {
                    "app_name": "app2",
                    "created_at": (start_time + timedelta(minutes=20)).isoformat()
                },
                {
                    "app_name": "app1",
                    "created_at": (start_time + timedelta(minutes=30)).isoformat()
                }
            ]
            
            summary = self.collector.get_activity_summary(start_time, end_time)
            self.assertIn("total_time", summary)
            self.assertIn("app_usage", summary)
            self.assertIn("start_time", summary)
            self.assertIn("end_time", summary)

    def test_cleanup_old_activity(self):
        """Test cleanup of old activity logs."""
        with patch.object(self.collector.db, 'delete_old_activity_logs') as mock_delete:
            self.collector.cleanup_old_activity(days=7)
            mock_delete.assert_called_once()

if __name__ == '__main__':
    unittest.main() 