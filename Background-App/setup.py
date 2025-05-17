from setuptools import setup, find_packages

setup(
    name="workmatrix",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "supabase==2.3.0",
        "python-dotenv==1.0.0",
        "psutil==5.9.8",
        "pyautogui==0.9.54",
        "Pillow==10.2.0",
        "opencv-python==4.9.0.80",
        "numpy==1.26.4",
        "pygetwindow==0.0.9",
        "mss==9.0.1",
        "pynput==1.7.6",
        "python-dateutil==2.8.2",
        "requests==2.31.0",
        "websockets==12.0",
        "loguru==0.7.2",
    ],
    python_requires=">=3.8",
) 