# WorkMatrix Background App

This is the background monitoring application for WorkMatrix that tracks user activity, takes screenshots, and syncs data with Supabase.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Supabase account and credentials

## Directory Structure

```
Background-App/
├── src/
│   ├── main.py              # Main application entry point
│   ├── services/            # Service modules
│   │   ├── monitor_api.py   # API monitoring service
│   │   ├── storage_manager.py # Storage management service
│   │   └── supabase_sync.py # Supabase synchronization service
│   ├── utils/              # Utility functions
│   │   ├── database.py     # Database utilities
│   │   └── init_supabase.py # Supabase initialization
│   └── config/             # Configuration management
│       └── config.py       # Application configuration
├── scripts/
│   ├── linux/             # Linux-specific scripts
│   │   ├── start.sh       # Start script
│   │   ├── setup.sh       # Setup script
│   │   ├── monitor.sh     # Monitoring script
│   │   ├── backup.sh      # Backup script
│   │   ├── uninstall_service.sh # Service uninstallation
│   │   └── workmatrix.service # Systemd service file
│   └── windows/           # Windows-specific scripts
│       ├── start.bat      # Start script
│       ├── setup.bat      # Setup script
│       ├── monitor.bat    # Monitoring script
│       ├── backup.bat     # Backup script
│       ├── install_windows_service.bat # Service installation
│       └── uninstall_windows_service.bat # Service uninstallation
├── docs/
│   ├── deployment/        # Deployment documentation
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   └── ROLLOUT.md
│   ├── monitoring/        # Monitoring documentation
│   │   ├── MONITORING.md
│   │   └── SERVICE_MANAGEMENT.md
│   └── testing/          # Testing documentation
│       └── TESTING.md
├── data/
│   ├── logs/            # Application logs
│   └── backups/         # Backup files
├── tests/               # Test files
├── .env                 # Environment variables
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Background-App
```

2. Create a `.env` file in the root directory with your Supabase credentials:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Application Settings
SCREENSHOT_INTERVAL=300  # 5 minutes
SYNC_INTERVAL=1800      # 30 minutes
MAX_STORAGE_MB=450      # 450 MB
IDLE_THRESHOLD=300      # 5 minutes
BREAK_THRESHOLD=900     # 15 minutes
LOG_LEVEL=INFO          # Logging level (DEBUG, INFO, WARNING, ERROR)
```

## Running the Application

### Linux/macOS
```bash
./scripts/linux/start.sh
```

### Windows
```batch
scripts\windows\start.bat
```

## Features

- Activity monitoring (mouse movements, keystrokes)
- Screenshot capture
- Application usage tracking
- Idle detection
- Break detection
- Data synchronization with Supabase

## Troubleshooting

1. **Python not found**
   - Ensure Python 3.8+ is installed
   - Verify Python is in your system PATH

2. **Virtual environment issues**
   - Delete the `venv` directory and run the start script again
   - Ensure you have permissions to create directories

3. **Missing dependencies**
   - Run `pip install -r requirements.txt` manually
   - Check for any error messages during installation

4. **Supabase connection issues**
   - Verify your Supabase credentials in `.env`
   - Check your internet connection
   - Ensure your Supabase project is active

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 