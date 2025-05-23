import PyInstaller.__main__
import os
import shutil
import sys
from pathlib import Path

def create_env_file(output_dir: str):
    """Create a template .env file in the output directory."""
    env_template = """
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Application Settings
SCREENSHOT_INTERVAL=300
KEYSTROKE_INTERVAL=60
SYNC_INTERVAL=300
IDLE_THRESHOLD=300

# WebSocket Configuration
WS_HOST=localhost
WS_PORT=8765

# Storage Settings
MAX_STORAGE_MB=500
MAX_FILE_AGE_DAYS=7
COMPRESSION_QUALITY=60
"""
    env_file = os.path.join(output_dir, '.env')
    with open(env_file, 'w') as f:
        f.write(env_template.strip())

def copy_resources(src_dir: str, dest_dir: str):
    """Copy necessary resource files to the output directory."""
    # Create directories
    os.makedirs(os.path.join(dest_dir, 'data', 'screenshots'), exist_ok=True)
    os.makedirs(os.path.join(dest_dir, 'logs'), exist_ok=True)
    os.makedirs(os.path.join(dest_dir, 'config'), exist_ok=True)

def build_exe():
    """Build the WorkMatrix background application executable."""
    # Get directories
    project_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(project_dir, '..', 'main application')
    os.makedirs(output_dir, exist_ok=True)

    # Define data files to include
    additional_data = [
        ('src/utils', 'utils'),
        ('src/services', 'services'),
        ('src/collectors', 'collectors'),
        ('src/config', 'config')
    ]

    # Hidden imports required for the application
    hidden_imports = [
        'PIL._tkinter',
        'win32gui',
        'win32con',
        'keyboard',
        'mouse',
        'websockets',
        'asyncio',
        'aiohttp',
        'sqlite3',
        'psutil',
        'dotenv'
    ]

    # PyInstaller options
    options = [
        'src/main.py',  # Main script
        '--name=workmatrix-background',  # Output name
        '--noconsole',  # No console window
        '--onefile',  # Single file
        f'--distpath={output_dir}',  # Output directory
        '--clean',  # Clean cache
        '--win-private-assemblies',  # Include private assemblies
        '--win-no-prefer-redirects',  # Don't prefer redirects
    ]

    # Add hidden imports
    for imp in hidden_imports:
        options.extend(['--hidden-import', imp])

    # Add data files
    for src, dst in additional_data:
        options.extend(['--add-data', f'{src};{dst}'])

    try:
        # Run PyInstaller
        PyInstaller.__main__.run(options)

        # Copy resources
        copy_resources(project_dir, output_dir)

        # Create .env template
        create_env_file(output_dir)

        # Create README
        readme_content = """
# WorkMatrix Background Service

This is the background monitoring service for WorkMatrix.

## Setup Instructions:

1. Configure the .env file with your Supabase credentials and desired settings
2. Ensure the following directory structure exists:
   - data/screenshots/ (for storing screenshots)
   - logs/ (for application logs)
   - config/ (for configuration files)

3. Start the application by running:
   workmatrix-background.exe

## Configuration:

Edit the .env file to customize:
- Screenshot interval
- Keystroke monitoring
- Sync frequency
- Storage limits
- WebSocket connection

## Troubleshooting:

Check the logs directory for:
- workmatrix.log (main application log)
- error.log (error messages)
- performance.log (performance metrics)
"""
        with open(os.path.join(output_dir, 'README.md'), 'w') as f:
            f.write(readme_content.strip())

        # Clean up build files
        build_dir = os.path.join(project_dir, 'build')
        if os.path.exists(build_dir):
            shutil.rmtree(build_dir)

        spec_file = os.path.join(project_dir, 'workmatrix-background.spec')
        if os.path.exists(spec_file):
            os.remove(spec_file)

        print(f"Build completed successfully. Output directory: {output_dir}")
        print("Don't forget to configure the .env file before running the application.")

    except Exception as e:
        print(f"Error during build: {e}")
        sys.exit(1)

if __name__ == "__main__":
    build_exe() 