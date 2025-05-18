# WorkMatrix Components Documentation

## Core Components

### 1. Event Manager (`src/utils/event_manager.py`)
Handles asynchronous event processing and distribution.

**Key Features:**
- Async event queue with configurable size
- Event throttling and batching
- Multiple handler support
- Event statistics tracking

**Usage:**
```python
event_manager = EventManager(max_queue_size=1000)
event_manager.register_handler('keyboard', handle_keyboard)
await event_manager.put_event('keyboard', event_data)
```

### 2. Resource Manager (`src/utils/resource_manager.py`)
Manages file resources, particularly screenshots.

**Key Features:**
- Automatic file cleanup
- Storage limit management
- Image compression
- Age-based file removal

**Usage:**
```python
resource_manager = ResourceManager(
    base_dir="path/to/data",
    max_storage_mb=500,
    max_file_age_days=7
)
```

### 3. Sync Manager (`src/utils/sync_manager.py`)
Handles data synchronization with Supabase.

**Key Features:**
- Batched data synchronization
- Retry mechanism with exponential backoff
- Concurrent sync prevention
- Sync status tracking

**Usage:**
```python
sync_manager = SyncManager(
    supabase_url="your_url",
    supabase_key="your_key",
    sqlite=sqlite_manager
)
```

### 4. Activity Monitor (`src/monitor.py`)
Main monitoring service coordinating all components.

**Key Features:**
- Keyboard and mouse tracking
- Window activity monitoring
- Screenshot capture
- Idle detection

## Configuration

### Logging (`src/utils/logging_config.py`)
Comprehensive logging system with multiple handlers:

1. **Main Log** (`workmatrix.log`):
   - All application logs
   - Rotating file (10MB, 5 backups)
   - Debug level and above

2. **Error Log** (`error.log`):
   - Error and critical logs only
   - Rotating file (10MB, 5 backups)

3. **Performance Log** (`performance.log`):
   - Performance metrics
   - Resource usage statistics

## Directory Structure

```
Background-App/
├── src/
│   ├── utils/
│   │   ├── event_manager.py
│   │   ├── resource_manager.py
│   │   ├── sync_manager.py
│   │   ├── sqlite_manager.py
│   │   └── logging_config.py
│   └── monitor.py
├── data/
│   └── screenshots/
├── logs/
│   ├── workmatrix.log
│   ├── error.log
│   └── performance.log
└── tests/
    ├── conftest.py
    └── test_*.py
```

## Performance Considerations

1. **Event Processing:**
   - Queue size limit: 1000 events
   - Throttling at 90% capacity
   - Async processing for better performance

2. **Resource Management:**
   - Default storage limit: 500MB
   - Image compression: 60% quality
   - Automatic cleanup when storage limit reached

3. **Synchronization:**
   - Batch size: 50 records
   - 5-minute sync interval
   - Exponential backoff for retries 