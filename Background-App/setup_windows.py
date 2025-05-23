import os
import sys
import shutil
import subprocess
import winreg
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('setup.log')
    ]
)
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        sys.exit(1)

def check_dependencies():
    """Check and install required dependencies."""
    required_packages = [
        'pywin32',
        'pyinstaller',
        'websockets',
        'supabase',
        'opencv-python',
        'pyautogui',
        'mss',
        'psutil',
        'python-dotenv'
    ]
    
    try:
        import pkg_resources
        installed = {pkg.key for pkg in pkg_resources.working_set}
        missing = [pkg for pkg in required_packages if pkg.lower() not in installed]
        
        if missing:
            logger.info(f"Installing missing dependencies: {', '.join(missing)}")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
    except Exception as e:
        logger.error(f"Error checking/installing dependencies: {str(e)}")
        sys.exit(1)

def create_spec_file():
    """Create PyInstaller spec file."""
    spec_content = """# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['src/windows_service.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('src/utils/config.py', 'utils'),
        ('src/collectors/*.py', 'collectors'),
        ('src/services/*.py', 'services'),
        ('.env', '.'),
    ],
    hiddenimports=[
        'win32timezone',
        'websockets',
        'supabase',
        'cv2',
        'pyautogui',
        'mss',
        'psutil',
        'dotenv'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='WorkMatrixService',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico'
)
"""
    
    with open('WorkMatrixService.spec', 'w') as f:
        f.write(spec_content)

def build_executable():
    """Build the executable using PyInstaller."""
    try:
        logger.info("Building executable...")
        subprocess.check_call([
            'pyinstaller',
            '--clean',
            '--noconfirm',
            'WorkMatrixService.spec'
        ])
        logger.info("Executable built successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error building executable: {str(e)}")
        sys.exit(1)

def create_installer():
    """Create a simple installer script."""
    installer_content = """@echo off
echo Installing WorkMatrix Service...

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this installer as Administrator
    pause
    exit /b 1
)

REM Stop existing service if running
sc query WorkMatrixService >nul 2>&1
if %errorLevel% equ 0 (
    net stop WorkMatrixService
    sc delete WorkMatrixService
)

REM Create service
sc create WorkMatrixService binPath= "%~dp0WorkMatrixService.exe" start= auto DisplayName= "WorkMatrix Background Service"
sc description WorkMatrixService "Manages background data collection and synchronization for WorkMatrix"

REM Set service to auto-start
sc config WorkMatrixService start= auto

REM Start the service
net start WorkMatrixService

echo Installation complete!
pause
"""
    
    with open('install_service.bat', 'w') as f:
        f.write(installer_content)

def create_uninstaller():
    """Create an uninstaller script."""
    uninstaller_content = """@echo off
echo Uninstalling WorkMatrix Service...

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this uninstaller as Administrator
    pause
    exit /b 1
)

REM Stop and delete service
sc query WorkMatrixService >nul 2>&1
if %errorLevel% equ 0 (
    net stop WorkMatrixService
    sc delete WorkMatrixService
)

REM Remove files
del /f /q WorkMatrixService.exe
del /f /q install_service.bat
del /f /q uninstall_service.bat

echo Uninstallation complete!
pause
"""
    
    with open('uninstall_service.bat', 'w') as f:
        f.write(uninstaller_content)

def setup():
    """Main setup function."""
    try:
        logger.info("Starting setup process...")
        
        # Check Python version
        check_python_version()
        
        # Check and install dependencies
        check_dependencies()
        
        # Create spec file
        create_spec_file()
        
        # Build executable
        build_executable()
        
        # Create installer and uninstaller
        create_installer()
        create_uninstaller()
        
        # Copy necessary files to dist directory
        dist_dir = Path('dist')
        shutil.copy('install_service.bat', dist_dir)
        shutil.copy('uninstall_service.bat', dist_dir)
        
        logger.info("Setup completed successfully!")
        logger.info("To install the service:")
        logger.info("1. Navigate to the 'dist' directory")
        logger.info("2. Run 'install_service.bat' as Administrator")
        
    except Exception as e:
        logger.error(f"Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    setup() 