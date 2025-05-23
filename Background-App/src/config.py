import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Database Configuration
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'workmatrix.db')

# Monitoring Configuration
SCREENSHOT_INTERVAL = int(os.getenv('SCREENSHOT_INTERVAL', '300'))  # 5 minutes
ACTIVITY_LOG_INTERVAL = int(os.getenv('ACTIVITY_LOG_INTERVAL', '60'))  # 1 minute
SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL', '300'))  # 5 minutes
IDLE_THRESHOLD = int(os.getenv('IDLE_THRESHOLD', '300'))  # 5 minutes

# Storage Configuration
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
SCREENSHOT_DIR = os.path.join(DATA_DIR, 'screenshots')
LOG_DIR = os.path.join(DATA_DIR, 'logs')

# Create necessary directories
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True) 