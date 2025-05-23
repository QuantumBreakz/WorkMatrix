from pathlib import Path
import os

# Base directories
ROOT_DIR = Path(__file__).parent.parent.parent
DATA_DIR = ROOT_DIR / "data"
LOGS_DIR = ROOT_DIR / "logs"
CONFIG_DIR = ROOT_DIR / "config"
TESTS_DIR = ROOT_DIR / "tests"

# Data subdirectories
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
RECORDINGS_DIR = DATA_DIR / "recordings"
ACTIVITY_DIR = DATA_DIR / "activity"
APP_USAGE_DIR = DATA_DIR / "app_usage"

# Log subdirectories
SCREENSHOT_LOGS = LOGS_DIR / "screenshots"
RECORDING_LOGS = LOGS_DIR / "recordings"
ACTIVITY_LOGS = LOGS_DIR / "activity"
APP_USAGE_LOGS = LOGS_DIR / "app_usage"
ERROR_LOGS = LOGS_DIR / "errors"

# Test subdirectories
TEST_DATA_DIR = TESTS_DIR / "data"
TEST_REPORTS_DIR = TESTS_DIR / "reports"
TEST_SCREENSHOTS_DIR = TEST_DATA_DIR / "screenshots"
TEST_RECORDINGS_DIR = TEST_DATA_DIR / "recordings"

def create_directory_structure():
    """Create all necessary directories if they don't exist."""
    directories = [
        DATA_DIR,
        LOGS_DIR,
        CONFIG_DIR,
        TESTS_DIR,
        SCREENSHOTS_DIR,
        RECORDINGS_DIR,
        ACTIVITY_DIR,
        APP_USAGE_DIR,
        SCREENSHOT_LOGS,
        RECORDING_LOGS,
        ACTIVITY_LOGS,
        APP_USAGE_LOGS,
        ERROR_LOGS,
        TEST_DATA_DIR,
        TEST_REPORTS_DIR,
        TEST_SCREENSHOTS_DIR,
        TEST_RECORDINGS_DIR
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        # Create .gitkeep files in empty directories
        if not any(directory.iterdir()):
            (directory / ".gitkeep").touch()

def get_user_data_dir(user_id: str) -> dict:
    """Get user-specific data directories."""
    return {
        "screenshots": SCREENSHOTS_DIR / user_id,
        "recordings": RECORDINGS_DIR / user_id,
        "activity": ACTIVITY_DIR / user_id,
        "app_usage": APP_USAGE_DIR / user_id
    }

def get_user_log_dir(user_id: str) -> dict:
    """Get user-specific log directories."""
    return {
        "screenshots": SCREENSHOT_LOGS / f"{user_id}.log",
        "recordings": RECORDING_LOGS / f"{user_id}.log",
        "activity": ACTIVITY_LOGS / f"{user_id}.log",
        "app_usage": APP_USAGE_LOGS / f"{user_id}.log",
        "errors": ERROR_LOGS / f"{user_id}.log"
    }

def ensure_user_directories(user_id: str):
    """Create user-specific directories."""
    user_dirs = get_user_data_dir(user_id)
    for directory in user_dirs.values():
        directory.mkdir(parents=True, exist_ok=True)
    
    # Create log files
    user_logs = get_user_log_dir(user_id)
    for log_file in user_logs.values():
        log_file.parent.mkdir(parents=True, exist_ok=True)
        if not log_file.exists():
            log_file.touch() 