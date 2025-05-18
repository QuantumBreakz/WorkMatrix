import os
import shutil
from pathlib import Path

class ProjectOrganizer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.dist_dir = self.project_root / 'dist'
        self.scripts_dir = self.project_root / 'scripts'
        self.tools_dir = self.project_root / 'tools'
        self.build_dir = self.project_root / 'build'

    def organize(self):
        """Reorganize the project structure."""
        # Create necessary directories
        self._create_directories()
        
        # Move files to appropriate locations
        self._organize_build_files()
        self._organize_scripts()
        self._organize_docs()
        self._organize_config_files()
        
        # Clean up unnecessary files
        self._cleanup()

    def _create_directories(self):
        """Create the new directory structure."""
        directories = [
            self.dist_dir,
            self.scripts_dir,
            self.tools_dir,
            self.build_dir,
            self.project_root / 'config',
            self.project_root / 'data' / 'screenshots',
            self.project_root / 'logs',
            self.project_root / 'docs' / 'api',
            self.project_root / 'docs' / 'guides',
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def _organize_build_files(self):
        """Organize build-related files."""
        # Move build scripts to tools directory
        build_files = [
            ('build_background.py', 'build_background.py'),
            ('build_exe.py', 'build_exe.py'),
            ('cleanup.py', 'cleanup.py')
        ]
        
        for src, dst in build_files:
            if (self.project_root / src).exists():
                shutil.move(
                    str(self.project_root / src),
                    str(self.tools_dir / dst)
                )

    def _organize_scripts(self):
        """Organize script files."""
        # Move PowerShell scripts to scripts directory
        if (self.project_root / 'start_workmatrix.ps1').exists():
            shutil.move(
                str(self.project_root / 'start_workmatrix.ps1'),
                str(self.scripts_dir / 'start_workmatrix.ps1')
            )

    def _organize_docs(self):
        """Organize documentation files."""
        # Move and organize documentation
        if (self.project_root / 'README.md').exists():
            shutil.copy(
                str(self.project_root / 'README.md'),
                str(self.project_root / 'docs' / 'README.md')
            )

        # Create documentation index
        index_content = """# WorkMatrix Background Service Documentation

## Guides
- [Getting Started](guides/getting-started.md)
- [Configuration](guides/configuration.md)
- [Troubleshooting](guides/troubleshooting.md)

## API Documentation
- [Event Manager](api/event_manager.md)
- [Resource Manager](api/resource_manager.md)
- [Sync Manager](api/sync_manager.md)
- [Activity Monitor](api/activity_monitor.md)
"""
        with open(self.project_root / 'docs' / 'index.md', 'w') as f:
            f.write(index_content)

    def _organize_config_files(self):
        """Organize configuration files."""
        # Create default configuration
        config_content = """[app]
name = "WorkMatrix Background Service"
version = "1.0.0"

[monitoring]
screenshot_interval = 300
keystroke_interval = 60
sync_interval = 300
idle_threshold = 300

[storage]
max_storage_mb = 500
max_file_age_days = 7
compression_quality = 60

[websocket]
host = "localhost"
port = 8765
"""
        with open(self.project_root / 'config' / 'default.toml', 'w') as f:
            f.write(config_content)

    def _cleanup(self):
        """Clean up unnecessary files and empty directories."""
        # Remove unnecessary files and directories
        unnecessary = [
            'workmatrix_background.egg-info',
            'workmatrix.egg-info',
            '__pycache__',
            '.pytest_cache'
        ]
        
        for item in unnecessary:
            path = self.project_root / item
            if path.exists():
                if path.is_dir():
                    shutil.rmtree(str(path))
                else:
                    path.unlink()

def main():
    # Get project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Create and run organizer
    organizer = ProjectOrganizer(project_root)
    organizer.organize()
    
    print("Project reorganization completed successfully!")
    print("\nNew directory structure:")
    print("Background-App/")
    print("├── src/           # Source code")
    print("├── dist/          # Distribution files")
    print("├── tools/         # Build and maintenance tools")
    print("├── scripts/       # Utility scripts")
    print("├── config/        # Configuration files")
    print("├── data/          # Application data")
    print("├── logs/          # Log files")
    print("├── docs/          # Documentation")
    print("└── tests/         # Test files")

if __name__ == "__main__":
    main() 