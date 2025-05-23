import os
import shutil
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class ProjectCleaner:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.unnecessary_dirs = [
            'workmatrix_background.egg-info',
            'workmatrix.egg-info',
            'venv',
            '__pycache__',
            'migrations'
        ]
        self.unnecessary_files = [
            '.gitkeep',
            'api_monitor.log'
        ]

    def clean(self):
        """Clean up unnecessary files and directories."""
        try:
            # Remove unnecessary directories
            for dir_name in self.unnecessary_dirs:
                self._remove_recursive(dir_name)

            # Remove unnecessary files
            for file_name in self.unnecessary_files:
                self._remove_file(file_name)

            # Clean up data directory
            self._organize_data_dir()

            # Clean up logs directory
            self._organize_logs_dir()

            logger.info("Cleanup completed successfully")

        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            raise

    def _remove_recursive(self, target: str):
        """Remove directory and all its contents."""
        for path in self.project_root.rglob(target):
            if path.is_dir():
                try:
                    shutil.rmtree(path)
                    logger.info(f"Removed directory: {path}")
                except Exception as e:
                    logger.warning(f"Could not remove directory {path}: {e}")

    def _remove_file(self, target: str):
        """Remove specific file if it exists."""
        for path in self.project_root.rglob(target):
            if path.is_file():
                try:
                    path.unlink()
                    logger.info(f"Removed file: {path}")
                except Exception as e:
                    logger.warning(f"Could not remove file {path}: {e}")

    def _organize_data_dir(self):
        """Organize the data directory structure."""
        data_dir = self.project_root / 'data'
        if not data_dir.exists():
            return

        # Create necessary subdirectories
        subdirs = ['screenshots', 'temp', 'cache']
        for subdir in subdirs:
            (data_dir / subdir).mkdir(exist_ok=True)

        # Move any loose files to appropriate directories
        for file in data_dir.glob('*'):
            if file.is_file():
                if file.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                    shutil.move(str(file), str(data_dir / 'screenshots' / file.name))
                else:
                    shutil.move(str(file), str(data_dir / 'temp' / file.name))

    def _organize_logs_dir(self):
        """Organize the logs directory structure."""
        logs_dir = self.project_root / 'logs'
        if not logs_dir.exists():
            return

        # Move all log files to logs directory
        for log_file in self.project_root.glob('*.log'):
            if log_file.parent != logs_dir:
                shutil.move(str(log_file), str(logs_dir / log_file.name))

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    # Get project root directory
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # Create and run cleaner
    cleaner = ProjectCleaner(project_root)
    cleaner.clean()

if __name__ == "__main__":
    main() 