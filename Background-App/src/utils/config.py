from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
VIDEOS_DIR = DATA_DIR / "videos"
LOGS_DIR = DATA_DIR / "logs"
ACTIVITY_LOG_FILE = LOGS_DIR / "activity.log"

# Create necessary directories
for directory in [DATA_DIR, SCREENSHOTS_DIR, VIDEOS_DIR, LOGS_DIR]:
    directory.mkdir(exist_ok=True)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'http://localhost:54321')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
USER_ID = os.getenv('USER_ID', '')

# Data collection settings
SCREENSHOT_INTERVAL = int(os.getenv('SCREENSHOT_INTERVAL', '300'))  # 5 minutes in seconds
VIDEO_INTERVAL = 60 * 60       # 60 minutes in seconds
ACTIVITY_INTERVAL = 10 * 60    # 10 minutes in seconds
KEYSTROKE_INTERVAL = int(os.getenv('KEYSTROKE_INTERVAL', '60'))    # 1 minute in seconds
SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL', '120'))            # 2 minutes in seconds
MAX_STORAGE_MB = int(os.getenv("MAX_STORAGE_MB", 450))  # Maximum storage in MB

# Storage optimization
MAX_LOCAL_STORAGE = MAX_STORAGE_MB * 1024 * 1024  # Convert MB to bytes
SCREENSHOT_QUALITY = 30  # WebP quality (0-100)
VIDEO_QUALITY = "low"    # Video quality (low, medium, high)
VIDEO_DURATION = 10      # Video duration in seconds
MAX_SCREENSHOTS = 1000   # Maximum screenshots to keep locally
MAX_VIDEOS = 100         # Maximum videos to keep locally
SCREENSHOT_MAX_SIZE = 1024 * 1024  # 1MB maximum size for screenshots

# Data retention (30 days)
DATA_RETENTION_DAYS = 30

# Sync settings
BATCH_SIZE = 50          # Number of records to sync at once

# API limits
MAX_API_CALLS_PER_DAY = 1500  # Conservative limit
API_CALLS_PER_SYNC = 50       # Calls per sync operation

# Retry settings
MAX_RETRIES = 3
RETRY_DELAY = 60  # seconds

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
LOG_RETENTION = "1 week"

# Activity tracking
IDLE_THRESHOLD = int(os.getenv('IDLE_THRESHOLD', '300'))          # 5 minutes in seconds
MOUSE_MOVE_THRESHOLD = 10  # Minimum pixels for mouse movement
KEYSTROKE_THRESHOLD = 1   # Minimum keystrokes for activity

# WebSocket Configuration
WS_PORT = int(os.getenv('WS_PORT', '8765'))
WS_HOST = os.getenv('WS_HOST', 'localhost')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True) 