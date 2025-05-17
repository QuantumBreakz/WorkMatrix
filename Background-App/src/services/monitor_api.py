import os
import json
import logging
from datetime import datetime, timedelta
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class APIMonitor:
    def __init__(self):
        self.api_calls_file = Path("api_calls.json")
        self.monthly_limit = 50000  # Supabase free tier limit
        self.warning_threshold = 40000  # 80% of limit
        self.daily_limit = 1500  # Conservative daily limit

    def load_api_calls(self) -> dict:
        """Load API call data from JSON file."""
        try:
            if self.api_calls_file.exists():
                with open(self.api_calls_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading API calls data: {str(e)}")
        return {"date": datetime.now().date().isoformat(), "count": 0}

    def get_monthly_calls(self) -> int:
        """Calculate total API calls for current month."""
        total_calls = 0
        current_month = datetime.now().month
        current_year = datetime.now().year

        # Check last 30 days of data
        for i in range(30):
            date = datetime.now() - timedelta(days=i)
            if date.month == current_month and date.year == current_year:
                try:
                    data = self.load_api_calls()
                    if data["date"] == date.date().isoformat():
                        total_calls += data["count"]
                except Exception as e:
                    logger.error(f"Error getting calls for {date.date()}: {str(e)}")

        return total_calls

    def check_limits(self):
        """Check if API usage is approaching limits."""
        monthly_calls = self.get_monthly_calls()
        daily_data = self.load_api_calls()
        daily_calls = daily_data["count"]

        # Check monthly limit
        if monthly_calls >= self.monthly_limit:
            logger.critical(f"MONTHLY LIMIT EXCEEDED: {monthly_calls} calls")
        elif monthly_calls >= self.warning_threshold:
            logger.warning(f"Approaching monthly limit: {monthly_calls} calls")

        # Check daily limit
        if daily_calls >= self.daily_limit:
            logger.warning(f"Daily limit reached: {daily_calls} calls")

        # Log current usage
        logger.info(f"Current usage - Monthly: {monthly_calls}, Daily: {daily_calls}")

    def run(self, interval: int = 3600):
        """Run the monitor continuously."""
        logger.info("Starting API usage monitor...")
        while True:
            try:
                self.check_limits()
                time.sleep(interval)
            except KeyboardInterrupt:
                logger.info("Monitor stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in monitor: {str(e)}")
                time.sleep(60)  # Wait a minute before retrying

if __name__ == "__main__":
    monitor = APIMonitor()
    monitor.run() 