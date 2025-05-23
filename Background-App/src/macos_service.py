import os
import sys
import logging
import asyncio
import json
import signal
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from .collectors.screenshot_collector import ScreenshotCollector
from .collectors.recording_collector import RecordingCollector
from .collectors.app_usage_collector import AppUsageCollector
from .services.websocket_server import WebSocketServer
from .services.supabase_sync import SupabaseSync
from .utils.config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    WEBSOCKET_HOST,
    WEBSOCKET_PORT,
    SCREENSHOTS_DIR,
    RECORDINGS_DIR,
    SYNC_INTERVAL
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/macos_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class WorkMatrixService:
    def __init__(self):
        self.running = False
        self.user_id: Optional[str] = None
        self.collectors: Dict[str, Any] = {}
        self.websocket_server: Optional[WebSocketServer] = None
        self.sync_manager: Optional[SupabaseSync] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

        # Set up signal handlers
        signal.signal(signal.SIGTERM, self.handle_signal)
        signal.signal(signal.SIGINT, self.handle_signal)

    def handle_signal(self, signum, frame):
        """Handle termination signals."""
        logger.info(f"Received signal {signum}")
        self.stop()

    def stop(self):
        """Stop the service."""
        logger.info("Stopping WorkMatrix service...")
        self.running = False
        if self.loop:
            self.loop.call_soon_threadsafe(self.loop.stop)

    async def initialize_collectors(self, user_id: str):
        """Initialize collectors for a user."""
        try:
            # Create necessary directories
            os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
            os.makedirs(RECORDINGS_DIR, exist_ok=True)

            # Initialize collectors
            screenshot_collector = ScreenshotCollector(user_id)
            recording_collector = RecordingCollector(user_id)
            app_usage_collector = AppUsageCollector(user_id)

            self.collectors[user_id] = {
                'screenshot': screenshot_collector,
                'recording': recording_collector,
                'app_usage': app_usage_collector
            }

            logger.info(f"Collectors initialized for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error initializing collectors: {str(e)}")
            return False

    async def cleanup_collectors(self, user_id: str):
        """Clean up collectors for a user."""
        try:
            if user_id in self.collectors:
                for collector in self.collectors[user_id].values():
                    collector.close()
                del self.collectors[user_id]
                logger.info(f"Collectors cleaned up for user {user_id}")
        except Exception as e:
            logger.error(f"Error cleaning up collectors: {str(e)}")

    async def handle_websocket_message(self, websocket, message: Dict[str, Any]):
        """Handle incoming WebSocket messages."""
        try:
            message_type = message.get('type')
            user_id = message.get('user_id')

            if message_type == 'auth':
                if await self.initialize_collectors(user_id):
                    self.user_id = user_id
                    self.sync_manager = SupabaseSync(user_id)
                    await websocket.send(json.dumps({
                        'type': 'auth_success',
                        'timestamp': datetime.utcnow().isoformat()
                    }))
                else:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': 'Failed to initialize collectors',
                        'timestamp': datetime.utcnow().isoformat()
                    }))

            elif message_type == 'start_monitoring':
                if not user_id or user_id not in self.collectors:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': 'Not authenticated or collectors not initialized',
                        'timestamp': datetime.utcnow().isoformat()
                    }))
                    return

                # Start collectors
                for collector in self.collectors[user_id].values():
                    if hasattr(collector, 'start'):
                        collector.start()

                await websocket.send(json.dumps({
                    'type': 'monitoring_started',
                    'timestamp': datetime.utcnow().isoformat()
                }))

            elif message_type == 'stop_monitoring':
                if user_id in self.collectors:
                    await self.cleanup_collectors(user_id)
                    await websocket.send(json.dumps({
                        'type': 'monitoring_stopped',
                        'timestamp': datetime.utcnow().isoformat()
                    }))

            elif message_type == 'sync_now':
                if self.sync_manager:
                    self.sync_manager.sync_data()
                    await websocket.send(json.dumps({
                        'type': 'sync_complete',
                        'timestamp': datetime.utcnow().isoformat()
                    }))

        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }))

    async def run_websocket_server(self):
        """Run the WebSocket server."""
        try:
            self.websocket_server = WebSocketServer(
                host=WEBSOCKET_HOST,
                port=WEBSOCKET_PORT,
                message_handler=self.handle_websocket_message
            )
            await self.websocket_server.start()
        except Exception as e:
            logger.error(f"WebSocket server error: {str(e)}")
            raise

    async def run_sync_loop(self):
        """Run the sync loop."""
        while self.running:
            try:
                if self.sync_manager:
                    self.sync_manager.sync_data()
                await asyncio.sleep(SYNC_INTERVAL)
            except Exception as e:
                logger.error(f"Sync error: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying

    async def cleanup(self):
        """Clean up resources."""
        try:
            # Stop WebSocket server
            if self.websocket_server:
                await self.websocket_server.stop()

            # Clean up collectors
            if self.user_id:
                await self.cleanup_collectors(self.user_id)

            logger.info("Service cleanup completed")
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")

    def run(self):
        """Main service loop."""
        try:
            logger.info("Starting WorkMatrix service...")
            self.running = True

            # Create event loop
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

            # Run WebSocket server and sync loop
            self.loop.run_until_complete(asyncio.gather(
                self.run_websocket_server(),
                self.run_sync_loop()
            ))

            # Keep service running
            self.loop.run_forever()

        except Exception as e:
            logger.error(f"Main loop error: {str(e)}")
            raise
        finally:
            # Cleanup
            if self.loop:
                self.loop.run_until_complete(self.cleanup())
                self.loop.close()

if __name__ == '__main__':
    service = WorkMatrixService()
    service.run() 