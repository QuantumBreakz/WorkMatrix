# Windows Deployment Guide

This guide explains how to deploy the WorkMatrix background service on Windows machines.

## Prerequisites

- Windows 10 or later
- Administrator privileges
- Python 3.8 or higher (for development only)
- Internet connection for initial setup

## Installation

### Option 1: Using the Installer (Recommended)

1. Download the latest release from the releases page
2. Extract the ZIP file to a desired location
3. Right-click `install_service.bat` and select "Run as administrator"
4. Follow the on-screen instructions
5. The service will be installed and started automatically

### Option 2: Manual Installation (For Developers)

1. Clone the repository
2. Navigate to the Background-App directory
3. Run the setup script:
   ```powershell
   python setup_windows.py
   ```
4. Navigate to the `dist` directory
5. Run `install_service.bat` as administrator

## Service Management

### Using Windows Services

1. Open Services (services.msc)
2. Find "WorkMatrix Background Service"
3. Right-click to:
   - Start/Stop the service
   - Change startup type
   - View properties

### Using Command Line

```powershell
# Start the service
net start WorkMatrixService

# Stop the service
net stop WorkMatrixService

# Check service status
sc query WorkMatrixService
```

## Uninstallation

### Using the Uninstaller

1. Navigate to the installation directory
2. Right-click `uninstall_service.bat`
3. Select "Run as administrator"
4. Follow the on-screen instructions

### Manual Uninstallation

```powershell
# Stop and delete the service
net stop WorkMatrixService
sc delete WorkMatrixService

# Remove the files manually
```

## Configuration

The service uses a `.env` file for configuration. Create this file in the same directory as the executable:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# WebSocket Configuration
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=8765

# Storage Configuration
SCREENSHOTS_DIR=data/screenshots
RECORDINGS_DIR=data/recordings

# Sync Configuration
SYNC_INTERVAL=300  # 5 minutes
```

## Logs

Logs are stored in the following locations:
- Service logs: `logs/windows_service.log`
- Setup logs: `setup.log`
- Application logs: `logs/workmatrix.log`

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check if Python is installed correctly
   - Verify administrator privileges
   - Check the service logs

2. **No data collection**
   - Verify the `.env` file configuration
   - Check network connectivity
   - Verify Supabase credentials

3. **High CPU/Memory usage**
   - Check the sync interval in `.env`
   - Verify collector settings
   - Monitor system resources

### Log Analysis

1. Open Event Viewer
2. Navigate to Windows Logs > Application
3. Look for entries from "WorkMatrixService"

### Support

For additional support:
1. Check the service logs
2. Contact technical support
3. Submit an issue on GitHub

## Security Considerations

1. **File Permissions**
   - The service requires administrator privileges
   - Data directories are protected
   - Logs are accessible only to administrators

2. **Network Security**
   - WebSocket communication is encrypted
   - Supabase connection uses secure protocols
   - All API calls are authenticated

3. **Data Protection**
   - Screenshots and recordings are stored locally
   - Data is encrypted during transmission
   - Regular cleanup of old data

## Updates

To update the service:
1. Stop the current service
2. Run the new installer
3. The service will be updated automatically

## Best Practices

1. **Regular Maintenance**
   - Monitor disk space
   - Check log files
   - Verify sync status

2. **Performance**
   - Adjust sync interval as needed
   - Monitor system resources
   - Regular cleanup of old data

3. **Security**
   - Keep the service updated
   - Monitor access logs
   - Regular security audits

## Development

For developers:
1. Use the manual installation method
2. Enable debug logging
3. Monitor the service in real-time

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 