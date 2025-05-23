import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set
import websockets
from websockets.server import WebSocketServerProtocol
from ..collectors.activity_collector import ActivityCollector
from ..collectors.screenshot_collector import ScreenshotCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/websocket.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self, host: str = 'localhost', port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Dict[str, Set[WebSocketServerProtocol]] = {}
        self.collectors: Dict[str, tuple[ActivityCollector, ScreenshotCollector]] = {}
        logger.info(f"WebSocket server initialized on {host}:{port}")

    async def register(self, websocket: WebSocketServerProtocol, user_id: str):
        """Register a new client connection and initialize collectors."""
        if user_id not in self.clients:
            self.clients[user_id] = set()
            # Initialize collectors for this user
            activity_collector = ActivityCollector(user_id)
            screenshot_collector = ScreenshotCollector(user_id)
            self.collectors[user_id] = (activity_collector, screenshot_collector)
            
        self.clients[user_id].add(websocket)
        logger.info(f"Client registered for user {user_id}")

    async def unregister(self, websocket: WebSocketServerProtocol, user_id: str):
        """Unregister a client connection and cleanup collectors if needed."""
        if user_id in self.clients:
            self.clients[user_id].remove(websocket)
            if not self.clients[user_id]:
                # No more clients for this user, cleanup collectors
                if user_id in self.collectors:
                    activity_collector, screenshot_collector = self.collectors[user_id]
                    activity_collector.close()
                    screenshot_collector.close()
                    del self.collectors[user_id]
                del self.clients[user_id]
        logger.info(f"Client unregistered for user {user_id}")

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Broadcast a message to all clients of a specific user."""
        if user_id in self.clients:
            disconnected = set()
            for client in self.clients[user_id]:
                try:
                    await client.send(json.dumps(message))
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)
            
            # Clean up disconnected clients
            for client in disconnected:
                await self.unregister(client, user_id)

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle client connection and messages."""
        user_id = None
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get('type')

                    if message_type == 'auth':
                        user_id = data.get('user_id')
                        if not user_id:
                            await websocket.send(json.dumps({
                                'type': 'error',
                                'error': 'Authentication failed: No user ID provided',
                                'timestamp': datetime.utcnow().isoformat()
                            }))
                            continue

                        await self.register(websocket, user_id)
                        await websocket.send(json.dumps({
                            'type': 'auth_success',
                            'timestamp': datetime.utcnow().isoformat()
                        }))

                        # Start collecting data for this user
                        if user_id in self.collectors:
                            activity_collector, screenshot_collector = self.collectors[user_id]
                            activity_data = activity_collector.collect_activity()
                            if activity_data:
                                await self.broadcast_to_user(user_id, {
                                    'type': 'activity_update',
                                    'data': activity_data,
                                    'timestamp': datetime.utcnow().isoformat()
                                })

                    elif message_type == 'start_monitoring':
                        if not user_id or user_id not in self.collectors:
                            await websocket.send(json.dumps({
                                'type': 'error',
                                'error': 'Not authenticated or collectors not initialized',
                                'timestamp': datetime.utcnow().isoformat()
                            }))
                            continue

                        # Start monitoring for this user
                        activity_collector, screenshot_collector = self.collectors[user_id]
                        activity_data = activity_collector.collect_activity()
                        if activity_data:
                            await self.broadcast_to_user(user_id, {
                                'type': 'activity_update',
                                'data': activity_data,
                                'timestamp': datetime.utcnow().isoformat()
                            })

                    elif message_type == 'stop_monitoring':
                        if user_id in self.collectors:
                            activity_collector, screenshot_collector = self.collectors[user_id]
                            activity_collector.close()
                            screenshot_collector.close()

                    elif message_type == 'ping':
                        await websocket.send(json.dumps({
                            'type': 'pong',
                            'timestamp': datetime.utcnow().isoformat()
                        }))

                    else:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'error': f'Unknown message type: {message_type}',
                            'timestamp': datetime.utcnow().isoformat()
                        }))

                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': 'Invalid JSON message',
                        'timestamp': datetime.utcnow().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Error handling message: {str(e)}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': 'Internal server error',
                        'timestamp': datetime.utcnow().isoformat()
                    }))

        except websockets.exceptions.ConnectionClosed:
            logger.info("Client connection closed")
        finally:
            if user_id:
                await self.unregister(websocket, user_id)

    async def start(self):
        """Start the WebSocket server."""
        try:
            async with websockets.serve(self.handle_client, self.host, self.port):
                logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
                await asyncio.Future()  # run forever
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {str(e)}")
            raise

async def start_websocket_server():
    """Start the WebSocket server."""
    server = WebSocketServer()
    await server.start()

if __name__ == "__main__":
    asyncio.run(start_websocket_server()) 