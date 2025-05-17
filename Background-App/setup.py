from setuptools import setup, find_packages

setup(
    name="workmatrix-background",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "supabase>=1.0.3",
        "python-dotenv==1.0.1",
        "asyncpg==0.29.0",
        "psutil==5.9.8",
        "pyautogui==0.9.54",
        "Pillow==10.2.0",
        "opencv-python==4.9.0.80",
        "numpy==1.26.4",
        "pygetwindow==0.0.9",
        "keyboard==0.13.5",
        "mouse==0.7.1",
        "schedule==1.2.1",
        "mss==9.0.1",
        "pynput==1.7.6",
        "aiohttp==3.9.3",
        "asyncio==3.4.3",
        "websockets==12.0",
        "loguru==0.7.2"
    ],
    python_requires=">=3.8",
) 