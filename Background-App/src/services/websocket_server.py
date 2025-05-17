import asyncio
import websockets
import json
import logging
from datetime import datetime
from typing import Dict, Set

logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.user_sessions: Dict[str, websockets.WebSocketServerProtocol] = {}

    async def start(self):
        """Start the WebSocket server."""
        server = await websockets.serve(
            self.handle_client,
            self.host,
            self.port
        )
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
        await server.wait_closed()

    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Handle incoming WebSocket connections."""
        try:
            # Add client to set
            self.clients.add(websocket)
            
            # Handle authentication
            auth_message = await websocket.recv()
            auth_data = json.loads(auth_message)
            
            if "user_id" not in auth_data:
                await websocket.close(1008, "Authentication required")
                return
                
            user_id = auth_data["user_id"]
            self.user_sessions[user_id] = websocket
            logger.info(f"User {user_id} connected")
            
            # Send initial connection success
            await websocket.send(json.dumps({
                "type": "connection_status",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }))
            
            # Keep connection alive and handle messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(websocket, data)
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Error handling message: {str(e)}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("Client disconnected")
        finally:
            # Clean up
            self.clients.remove(websocket)
            if user_id in self.user_sessions:
                del self.user_sessions[user_id]

    async def handle_message(self, websocket: websockets.WebSocketServerProtocol, data: dict):
        """Handle incoming WebSocket messages."""
        message_type = data.get("type")
        
        if message_type == "ping":
            await websocket.send(json.dumps({
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            }))
        else:
            logger.warning(f"Unknown message type: {message_type}")

    async def broadcast_activity(self, user_id: str, activity_data: dict):
        """Broadcast activity data to specific user."""
        if user_id in self.user_sessions:
            websocket = self.user_sessions[user_id]
            try:
                await websocket.send(json.dumps({
                    "type": "activity_update",
                    "data": activity_data,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except websockets.exceptions.ConnectionClosed:
                logger.error(f"Failed to send activity update to user {user_id}")

    async def broadcast_screenshot(self, user_id: str, screenshot_data: dict):
        """Broadcast screenshot data to specific user."""
        if user_id in self.user_sessions:
            websocket = self.user_sessions[user_id]
            try:
                await websocket.send(json.dumps({
                    "type": "screenshot_update",
                    "data": screenshot_data,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except websockets.exceptions.ConnectionClosed:
                logger.error(f"Failed to send screenshot update to user {user_id}")

    async def broadcast_status(self, user_id: str, status: str):
        """Broadcast status updates to specific user."""
        if user_id in self.user_sessions:
            websocket = self.user_sessions[user_id]
            try:
                await websocket.send(json.dumps({
                    "type": "status_update",
                    "status": status,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except websockets.exceptions.ConnectionClosed:
                logger.error(f"Failed to send status update to user {user_id}")

async def start_websocket_server():
    """Start the WebSocket server."""
    server = WebSocketServer()
    await server.start()

if __name__ == "__main__":
    asyncio.run(start_websocket_server()) 