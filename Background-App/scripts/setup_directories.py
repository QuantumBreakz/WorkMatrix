import os
import logging
from pathlib import Path

def setup_directories():
    """Create the required directory structure for the WorkMatrix application."""
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Define required directories
    directories = [
        'data/screenshots',  # For storing screenshots
        'logs',             # For application logs
        'config',           # For configuration files
        'tests/collectors', # For collector test cases
        'tests/data',       # For test data
        'tests/logs'        # For test logs
    ]
    
    # Create directories
    for dir_path in directories:
        full_path = project_root / dir_path
        try:
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"Created directory: {full_path}")
        except Exception as e:
            print(f"Error creating directory {full_path}: {e}")
    
    # Create .gitkeep files to preserve empty directories
    for dir_path in directories:
        gitkeep_file = project_root / dir_path / '.gitkeep'
        try:
            gitkeep_file.touch(exist_ok=True)
        except Exception as e:
            print(f"Error creating .gitkeep in {dir_path}: {e}")

if __name__ == "__main__":
    setup_directories() 