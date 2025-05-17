import os
import sys
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from .services.websocket_server import start_websocket_server
from .services.monitor_api import APIMonitor
from .utils.config import (
    SCREENSHOT_INTERVAL,
    KEYSTROKE_INTERVAL,
    SYNC_INTERVAL,
    IDLE_THRESHOLD
)

# Load environment variables
load_dotenv()

# Configure logging
def setup_logging():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    # Create handlers
    console_handler = logging.StreamHandler()
    file_handler = logging.FileHandler('logs/workmatrix.log')

    # Create formatters and add it to handlers
    log_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(log_format)
    file_handler.setFormatter(log_format)

    # Add handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

# Get logger
logger = setup_logging()

async def main():
    """
    Main entry point for the application.
    """
    try:
        # Start WebSocket server
        websocket_task = asyncio.create_task(start_websocket_server())
        
        # Start API monitor
        api_monitor = APIMonitor()
        api_task = asyncio.create_task(api_monitor.run())

        # Wait for all tasks
        await asyncio.gather(websocket_task, api_task)

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Application stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1) 