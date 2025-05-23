import os
import sys
import shutil
from pathlib import Path
import logging
from datetime import datetime

# Add the Background-App directory to Python path
script_dir = Path(__file__).parent
app_dir = script_dir.parent
sys.path.append(str(app_dir))

from src.config.directory_config import (
    create_directory_structure,
    DATA_DIR,
    LOGS_DIR,
    TESTS_DIR,
    SCREENSHOTS_DIR,
    RECORDINGS_DIR,
    ACTIVITY_DIR,
    APP_USAGE_DIR
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/organize_files.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def move_screenshots():
    """Move screenshots to new directory structure."""
    try:
        # Find all screenshot directories
        old_screenshot_dirs = [
            Path('data/screenshots'),
            Path('screenshots'),
            Path('Background-App/data/screenshots')
        ]
        
        for old_dir in old_screenshot_dirs:
            if old_dir.exists():
                # Move each user's screenshots
                for user_dir in old_dir.iterdir():
                    if user_dir.is_dir():
                        new_dir = SCREENSHOTS_DIR / user_dir.name
                        if not new_dir.exists():
                            new_dir.mkdir(parents=True)
                        
                        # Move files
                        for file in user_dir.glob('*'):
                            if file.is_file():
                                shutil.move(str(file), str(new_dir / file.name))
                                logger.info(f"Moved screenshot: {file} -> {new_dir / file.name}")
                
                # Remove old directory if empty
                if not any(old_dir.iterdir()):
                    old_dir.rmdir()
                    logger.info(f"Removed empty directory: {old_dir}")
    except Exception as e:
        logger.error(f"Error moving screenshots: {str(e)}")

def move_recordings():
    """Move recordings to new directory structure."""
    try:
        # Find all recording directories
        old_recording_dirs = [
            Path('data/recordings'),
            Path('recordings'),
            Path('Background-App/data/recordings')
        ]
        
        for old_dir in old_recording_dirs:
            if old_dir.exists():
                # Move each user's recordings
                for user_dir in old_dir.iterdir():
                    if user_dir.is_dir():
                        new_dir = RECORDINGS_DIR / user_dir.name
                        if not new_dir.exists():
                            new_dir.mkdir(parents=True)
                        
                        # Move files
                        for file in user_dir.glob('*'):
                            if file.is_file():
                                shutil.move(str(file), str(new_dir / file.name))
                                logger.info(f"Moved recording: {file} -> {new_dir / file.name}")
                
                # Remove old directory if empty
                if not any(old_dir.iterdir()):
                    old_dir.rmdir()
                    logger.info(f"Removed empty directory: {old_dir}")
    except Exception as e:
        logger.error(f"Error moving recordings: {str(e)}")

def move_logs():
    """Move log files to new directory structure."""
    try:
        # Find all log files
        old_log_files = [
            Path('logs'),
            Path('Background-App/logs'),
            Path('api_monitor.log')
        ]
        
        for old_path in old_log_files:
            if old_path.exists():
                if old_path.is_file():
                    # Move single log file
                    new_path = LOGS_DIR / old_path.name
                    shutil.move(str(old_path), str(new_path))
                    logger.info(f"Moved log file: {old_path} -> {new_path}")
                else:
                    # Move directory contents
                    for log_file in old_path.glob('*'):
                        if log_file.is_file():
                            new_path = LOGS_DIR / log_file.name
                            shutil.move(str(log_file), str(new_path))
                            logger.info(f"Moved log file: {log_file} -> {new_path}")
                    
                    # Remove old directory if empty
                    if not any(old_path.iterdir()):
                        old_path.rmdir()
                        logger.info(f"Removed empty directory: {old_path}")
    except Exception as e:
        logger.error(f"Error moving logs: {str(e)}")

def move_test_files():
    """Move test files to new directory structure."""
    try:
        # Move test reports
        old_test_reports = [
            Path('tests/reports'),
            Path('Background-App/tests/reports')
        ]
        
        for old_dir in old_test_reports:
            if old_dir.exists():
                for report in old_dir.glob('*'):
                    if report.is_file():
                        new_path = TESTS_DIR / 'reports' / report.name
                        shutil.move(str(report), str(new_path))
                        logger.info(f"Moved test report: {report} -> {new_path}")
                
                # Remove old directory if empty
                if not any(old_dir.iterdir()):
                    old_dir.rmdir()
                    logger.info(f"Removed empty directory: {old_dir}")
    except Exception as e:
        logger.error(f"Error moving test files: {str(e)}")

def cleanup_empty_directories():
    """Remove empty directories after moving files."""
    try:
        directories_to_check = [
            Path('data'),
            Path('logs'),
            Path('tests'),
            Path('Background-App/data'),
            Path('Background-App/logs'),
            Path('Background-App/tests')
        ]
        
        for directory in directories_to_check:
            if directory.exists() and not any(directory.iterdir()):
                directory.rmdir()
                logger.info(f"Removed empty directory: {directory}")
    except Exception as e:
        logger.error(f"Error cleaning up empty directories: {str(e)}")

def main():
    """Main function to organize files."""
    try:
        logger.info("Starting file organization...")
        
        # Create new directory structure
        create_directory_structure()
        logger.info("Created new directory structure")
        
        # Move files to new locations
        move_screenshots()
        move_recordings()
        move_logs()
        move_test_files()
        
        # Clean up empty directories
        cleanup_empty_directories()
        
        logger.info("File organization completed successfully")
        
    except Exception as e:
        logger.error(f"Error during file organization: {str(e)}")
        raise

if __name__ == "__main__":
    main() 