import asyncio
from datetime import datetime
from typing import Callable, Dict, List
import logging
from queue import Queue
from threading import Lock

logger = logging.getLogger(__name__)

class EventManager:
    def __init__(self, max_queue_size: int = 1000):
        self.event_queue = asyncio.Queue(maxsize=max_queue_size)
        self.handlers: Dict[str, List[Callable]] = {}
        self._running = False
        self._lock = Lock()
        self.event_counts = {
            'keyboard': 0,
            'mouse': 0,
            'window': 0
        }
        self.last_event_time = datetime.now()

    async def start(self):
        """Start the event processing loop."""
        self._running = True
        try:
            while self._running:
                event = await self.event_queue.get()
                await self._process_event(event)
                self.event_queue.task_done()
        except Exception as e:
            logger.error(f"Error in event processing loop: {e}")
            raise

    def stop(self):
        """Stop the event processing loop."""
        self._running = False

    async def put_event(self, event_type: str, event_data: dict):
        """Put an event into the queue with throttling."""
        try:
            # Basic throttling: skip if queue is nearly full
            if self.event_queue.qsize() > self.event_queue.maxsize * 0.9:
                logger.warning(f"Event queue nearly full, skipping {event_type} event")
                return

            current_time = datetime.now()
            # Update event counts and last event time
            with self._lock:
                self.event_counts[event_type] = self.event_counts.get(event_type, 0) + 1
                self.last_event_time = current_time

            await self.event_queue.put({
                'type': event_type,
                'data': event_data,
                'timestamp': current_time.isoformat()
            })
        except Exception as e:
            logger.error(f"Error putting event in queue: {e}")

    async def _process_event(self, event: dict):
        """Process a single event."""
        event_type = event['type']
        if event_type in self.handlers:
            for handler in self.handlers[event_type]:
                try:
                    await handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler for {event_type}: {e}")

    def register_handler(self, event_type: str, handler: Callable):
        """Register an event handler."""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)

    def get_event_stats(self) -> dict:
        """Get current event statistics."""
        with self._lock:
            return {
                'counts': self.event_counts.copy(),
                'last_event_time': self.last_event_time,
                'queue_size': self.event_queue.qsize()
            }

    def reset_counts(self):
        """Reset event counts."""
        with self._lock:
            for key in self.event_counts:
                self.event_counts[key] = 0 