import os
from pathlib import Path

# App directories
APP_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = APP_DIR / "data"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
LOGS_DIR = DATA_DIR / "logs"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Monitoring intervals (in seconds)
SCREENSHOT_INTERVAL = 1800  # 30 minutes
ACTIVITY_INTERVAL = 1800    # 30 minutes
SYNC_INTERVAL = 86400      # 24 hours (once daily)

# Screenshot settings
SCREENSHOT_QUALITY = 60    # JPEG quality (0-100)
SCREENSHOT_MAX_SIZE = 500 * 1024  # 500KB max size

# Local storage limits
MAX_LOCAL_STORAGE = 500 * 1024 * 1024  # 500MB
MAX_SCREENSHOTS = 1000  # Maximum number of screenshots to keep locally

# Cache settings
CACHE_DURATION = 3600  # 1 hour in seconds
MAX_RETRIES = 3
RETRY_DELAY = 60  # seconds

# API rate limits
MAX_API_CALLS_PER_DAY = 1500  # Conservative limit for 10 employees
API_CALLS_PER_SYNC = 50  # Estimated API calls per sync operation 