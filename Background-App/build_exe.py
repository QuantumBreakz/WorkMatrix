import PyInstaller.__main__
import os
import shutil
import sys

def build_exe():
    """Build the WorkMatrix silent application executable."""
    # Create output directory
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'main application')
    os.makedirs(output_dir, exist_ok=True)

    # PyInstaller options
    options = [
        'src/run.py',  # Your main script
        '--name=workmatrix-silentapp',  # Output exe name
        '--noconsole',  # No console window
        '--onefile',  # Single file
        '--hidden-import=PIL._tkinter',  # Required hidden imports
        '--hidden-import=win32gui',
        '--hidden-import=win32con',
        '--hidden-import=keyboard',
        '--hidden-import=mouse',
        f'--distpath={output_dir}',  # Output directory
        '--clean',  # Clean cache
        '--add-data=src/utils;utils',  # Include utils
        '--icon=resources/icon.ico'  # Application icon
    ]

    # Run PyInstaller
    PyInstaller.__main__.run(options)

    # Clean up build files
    build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build')
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)

    spec_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'workmatrix-silentapp.spec')
    if os.path.exists(spec_file):
        os.remove(spec_file)

    print(f"Executable built successfully in: {output_dir}")

if __name__ == "__main__":
    build_exe() 