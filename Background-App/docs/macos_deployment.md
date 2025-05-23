# macOS Deployment Guide

This guide explains how to deploy the WorkMatrix background service on macOS machines.

## Prerequisites

- macOS 10.15 (Catalina) or later
- Administrator privileges
- Python 3.8 or higher
- Internet connection for initial setup

## Installation

### Option 1: Using the Installer (Recommended)

1. Download the latest release from the releases page
2. Extract the ZIP file
3. Open Terminal and navigate to the extracted directory
4. Run the installer:
   ```bash
   sudo ./setup_macos.sh
   ```
5. Follow the on-screen instructions

### Option 2: Manual Installation (For Developers)

1. Clone the repository
2. Navigate to the Background-App directory
3. Run the setup script:
   ```bash
   sudo ./setup_macos.sh
   ```

## Service Management

### Using launchctl

```bash
# Start the service
sudo launchctl start com.workmatrix.service

# Stop the service
sudo launchctl stop com.workmatrix.service

# Check service status
launchctl list | grep workmatrix
```

### Using System Preferences

1. Open System Preferences
2. Go to Users & Groups
3. Click the Login Items tab
4. The service should be listed as "WorkMatrix Background Service"

## Uninstallation

### Using the Uninstaller

1. Navigate to the installation directory
2. Run the uninstaller:
   ```bash
   sudo ./uninstall_macos.sh
   ```

### Manual Uninstallation

```bash
# Stop and unload the service
sudo launchctl unload /Library/LaunchDaemons/com.workmatrix.service.plist

# Remove files
sudo rm /Library/LaunchDaemons/com.workmatrix.service.plist
sudo rm /usr/local/bin/workmatrix-service
sudo rm -rf /Library/Application\ Support/WorkMatrix
sudo rm -rf /Library/Logs/WorkMatrix
```

## Configuration

The service uses a `.env` file for configuration. Create this file in the application support directory:

```bash
sudo nano /Library/Application\ Support/WorkMatrix/.env
```

Add the following configuration:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# WebSocket Configuration
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=8765

# Storage Configuration
SCREENSHOTS_DIR=/Library/Application Support/WorkMatrix/screenshots
RECORDINGS_DIR=/Library/Application Support/WorkMatrix/recordings

# Sync Configuration
SYNC_INTERVAL=300  # 5 minutes
```

## Logs

Logs are stored in the following locations:
- Service logs: `/Library/Logs/WorkMatrix/service.log`
- Error logs: `/Library/Logs/WorkMatrix/service.err`
- Application logs: `/Library/Logs/WorkMatrix/workmatrix.log`

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check Python installation
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

1. Open Console.app
2. Search for "WorkMatrix"
3. Check system.log and application logs

### Support

For additional support:
1. Check the service logs
2. Contact technical support
3. Submit an issue on GitHub

## Security Considerations

1. **File Permissions**
   - The service runs as root
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