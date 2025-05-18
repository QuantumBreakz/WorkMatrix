import pytest
import asyncio
from datetime import datetime

@pytest.mark.asyncio
async def test_event_queue_basic(event_manager, sample_events):
    """Test basic event queue functionality."""
    # Register a test handler
    received_events = []
    async def test_handler(event):
        received_events.append(event)
    
    event_manager.register_handler('keyboard', test_handler)
    
    # Start the event manager
    task = asyncio.create_task(event_manager.start())
    
    # Put an event
    await event_manager.put_event('keyboard', sample_events[0]['data'])
    
    # Give it time to process
    await asyncio.sleep(0.1)
    
    # Stop the event manager
    event_manager.stop()
    await task
    
    assert len(received_events) == 1
    assert received_events[0]['type'] == 'keyboard'

@pytest.mark.asyncio
async def test_event_queue_throttling(event_manager):
    """Test event queue throttling."""
    # Fill the queue to near capacity
    queue_size = event_manager.event_queue.maxsize
    events_to_send = int(queue_size * 0.95)
    
    for i in range(events_to_send):
        await event_manager.put_event('test', {'count': i})
    
    # Check queue size
    stats = event_manager.get_event_stats()
    assert stats['queue_size'] >= events_to_send * 0.9

@pytest.mark.asyncio
async def test_multiple_handlers(event_manager, sample_events):
    """Test multiple handlers for the same event type."""
    handler1_events = []
    handler2_events = []
    
    async def handler1(event):
        handler1_events.append(event)
    
    async def handler2(event):
        handler2_events.append(event)
    
    event_manager.register_handler('mouse', handler1)
    event_manager.register_handler('mouse', handler2)
    
    task = asyncio.create_task(event_manager.start())
    
    await event_manager.put_event('mouse', sample_events[1]['data'])
    await asyncio.sleep(0.1)
    
    event_manager.stop()
    await task
    
    assert len(handler1_events) == len(handler2_events) == 1

@pytest.mark.asyncio
async def test_error_handling(event_manager):
    """Test error handling in event processing."""
    async def failing_handler(event):
        raise Exception("Test error")
    
    event_manager.register_handler('test', failing_handler)
    
    task = asyncio.create_task(event_manager.start())
    
    # This should not raise an exception
    await event_manager.put_event('test', {'data': 'test'})
    await asyncio.sleep(0.1)
    
    event_manager.stop()
    await task

@pytest.mark.asyncio
async def test_event_stats(event_manager, sample_events):
    """Test event statistics tracking."""
    task = asyncio.create_task(event_manager.start())
    
    # Send events of different types
    for event in sample_events:
        await event_manager.put_event(event['type'], event['data'])
    
    await asyncio.sleep(0.1)
    
    stats = event_manager.get_event_stats()
    assert stats['counts']['keyboard'] == 1
    assert stats['counts']['mouse'] == 1
    assert stats['counts']['window'] == 1
    
    event_manager.stop()
    await task

@pytest.mark.asyncio
async def test_reset_counts(event_manager, sample_events):
    """Test resetting event counts."""
    for event in sample_events:
        await event_manager.put_event(event['type'], event['data'])
    
    event_manager.reset_counts()
    stats = event_manager.get_event_stats()
    
    assert all(count == 0 for count in stats['counts'].values()) 