# WorkMatrix Background Service

## Overview
The WorkMatrix Background Service is a Windows application that monitors user activity, captures screenshots, and syncs data with the WorkMatrix frontend application.

## Directory Structure
```
Background-App/
├── src/                # Source code
│   ├── utils/         # Utility modules
│   ├── services/      # Core services
│   └── collectors/    # Data collectors
├── dist/              # Distribution files
│   └── workmatrix-background.exe
├── tools/             # Build and maintenance tools
│   ├── build_background.py
│   ├── build_exe.py
│   └── cleanup.py
├── scripts/           # Utility scripts
│   └── start_workmatrix.ps1
├── config/            # Configuration files
│   └── default.toml
├── data/              # Application data
│   └── screenshots/
├── logs/              # Log files
├── docs/              # Documentation
│   ├── api/          # API documentation
│   ├── guides/       # User guides
│   └── index.md      # Documentation index
└── tests/             # Test files
    ├── conftest.py
    └── test_*.py
```

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Build the application:
```bash
python tools/build_background.py
```

3. Configure the application:
- Copy `config/default.toml` to `config/config.toml`
- Update the configuration values as needed

4. Run the application:
```powershell
.\scripts\start_workmatrix.ps1
```

## Development

### Building
The build process is handled by PyInstaller and configured in `tools/build_background.py`. To build:
```bash
python tools/build_background.py
```

### Testing
Run tests using pytest:
```bash
pytest tests/
```

### Documentation
- API documentation is in `docs/api/`
- User guides are in `docs/guides/`
- See `docs/index.md` for the documentation index

## Configuration

The application can be configured through:
1. Environment variables
2. Configuration file (`config/config.toml`)
3. Command-line arguments

Key configuration options:
- Screenshot interval
- Keystroke monitoring
- Sync frequency
- Storage limits
- WebSocket connection

## Troubleshooting

Check the following log files in the `logs` directory:
- `workmatrix.log` - Main application log
- `error.log` - Error messages
- `performance.log` - Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 