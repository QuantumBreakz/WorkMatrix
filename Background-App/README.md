# WorkMatrix Background Service

A Python-based system monitoring service that captures and processes employee activity data.

## Features

- 🖥️ **System Monitoring**
  - Application usage tracking
  - Active window detection
  - Idle time monitoring
  - Keyboard/mouse activity logging
  
- 📸 **Screenshot Management**
  - Configurable capture intervals
  - Privacy-aware capturing
  - Secure storage and encryption
  - Automatic cleanup
  
- 🔄 **Data Synchronization**
  - Real-time Supabase sync
  - Offline support with SQLite
  - Bandwidth-efficient uploads
  - Data compression
  
- 🔐 **Security**
  - End-to-end encryption
  - Secure data transmission
  - Privacy controls
  - Data retention policies

## Architecture

```
src/
├── collectors/           # Data collection modules
│   ├── activity/        # Activity tracking
│   ├── screenshot/      # Screenshot capture
│   └── system/          # System metrics
├── services/            # Core services
│   ├── monitor/        # Monitoring service
│   ├── storage/        # Data storage
│   └── sync/          # Sync service
├── utils/              # Utility functions
└── main.py            # Entry point
```

## Prerequisites

- Python 3.9 or higher
- Virtual environment (recommended)
- System dependencies:
  - Windows: `pywin32`
  - Linux: `xlib`, `scrot`
  - macOS: `pyobjc`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/QuantumBreakz/WorkMatrix.git
cd WorkMatrix/Background-App
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure the service:
```bash
cp config.example.py config.py
# Edit config.py with your settings
```

## Configuration

### config.py
```python
CONFIG = {
    'monitoring': {
        'screenshot_interval': 300,  # seconds
        'activity_interval': 60,     # seconds
        'idle_threshold': 300,       # seconds
    },
    'storage': {
        'max_local_storage': 1024,   # MB
        'retention_period': 30,      # days
    },
    'supabase': {
        'url': 'your_supabase_url',
        'key': 'your_supabase_key',
    }
}
```

## Usage

### Running the Service

#### Development
```bash
python src/main.py
```

#### Production

##### Linux (systemd)
1. Copy service file:
```bash
sudo cp scripts/linux/workmatrix.service /etc/systemd/system/
```

2. Start service:
```bash
sudo systemctl enable workmatrix
sudo systemctl start workmatrix
```

##### Windows
1. Install as Windows Service:
```bash
scripts\windows\install_windows_service.bat
```

2. Start service:
```bash
net start WorkMatrix
```

### Monitoring

The service provides several monitoring endpoints:

- Health check: `http://localhost:5000/health`
- Metrics: `http://localhost:5000/metrics`
- Status: `http://localhost:5000/status`

### Logs

- Linux: `/var/log/workmatrix/`
- Windows: `C:\ProgramData\WorkMatrix\logs\`

## Development

### Project Structure

```
Background-App/
├── docs/               # Documentation
├── migrations/         # Database migrations
├── scripts/           # Installation scripts
│   ├── linux/        # Linux scripts
│   └── windows/      # Windows scripts
├── src/              # Source code
├── tests/            # Test files
└── requirements.txt  # Python dependencies
```

### Adding New Collectors

1. Create a new collector class:
```python
from src.collectors import BaseCollector

class NewCollector(BaseCollector):
    def collect(self):
        # Implementation
        pass
```

2. Register in main.py:
```python
from collectors.new_collector import NewCollector

collector = NewCollector()
monitor.register_collector(collector)
```

### Testing

```bash
# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=src
```

## Security Considerations

### Data Privacy

- Screenshots are encrypted before storage
- Personal data is anonymized
- Sensitive windows are excluded
- Data is purged after retention period

### Network Security

- All API calls use HTTPS
- WebSocket connections are secured
- Data is compressed and encrypted
- Rate limiting is implemented

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check logs for errors
   - Verify permissions
   - Check dependencies

2. **High CPU Usage**
   - Adjust collection intervals
   - Check resource limits
   - Update collectors

3. **Sync Issues**
   - Check network connection
   - Verify Supabase credentials
   - Check local storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

### Code Style

We follow PEP 8 guidelines. Use `black` for formatting:

```bash
black src/
```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 