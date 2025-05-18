import pytest
import os
import tempfile
import asyncio
from typing import Generator, AsyncGenerator
from ..src.utils.event_manager import EventManager
from ..src.utils.resource_manager import ResourceManager
from ..src.utils.sync_manager import SyncManager
from ..src.utils.sqlite_manager import SQLiteManager

@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdirname:
        yield tmpdirname

@pytest.fixture
def event_manager():
    """Create an EventManager instance for testing."""
    manager = EventManager(max_queue_size=100)
    yield manager

@pytest.fixture
def resource_manager(temp_dir):
    """Create a ResourceManager instance for testing."""
    manager = ResourceManager(
        base_dir=temp_dir,
        max_storage_mb=10,
        max_file_age_days=1,
        compression_quality=60
    )
    yield manager

@pytest.fixture
def sqlite_manager(temp_dir):
    """Create a SQLiteManager instance for testing."""
    db_path = os.path.join(temp_dir, 'test.db')
    manager = SQLiteManager(db_path)
    yield manager

@pytest.fixture
def sync_manager(sqlite_manager):
    """Create a SyncManager instance for testing."""
    manager = SyncManager(
        supabase_url="http://test.example.com",
        supabase_key="test-key",
        sqlite=sqlite_manager,
        max_batch_size=10,
        sync_interval=5
    )
    yield manager

@pytest.fixture
async def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def sample_events():
    """Create sample events for testing."""
    return [
        {
            'type': 'keyboard',
            'data': {'key': 'a', 'event_type': 'down'},
            'timestamp': '2024-03-20T10:00:00'
        },
        {
            'type': 'mouse',
            'data': {'x': 100, 'y': 200, 'event_type': 'move'},
            'timestamp': '2024-03-20T10:00:01'
        },
        {
            'type': 'window',
            'data': {'title': 'Test Window', 'app': 'TestApp'},
            'timestamp': '2024-03-20T10:00:02'
        }
    ] 