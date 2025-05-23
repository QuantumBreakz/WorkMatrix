# Linux Deployment Guide

This guide explains how to deploy the WorkMatrix background service on Linux systems.

## Prerequisites

- Linux distribution (Ubuntu 20.04+, CentOS 8+, or Debian 11+)
- Root or sudo privileges
- Python 3.8 or higher
- Internet connection for initial setup
- systemd (for service management)

## Installation

### Option 1: Using the Installer (Recommended)

1. Download the latest release from the releases page
2. Extract the archive
3. Open terminal and navigate to the extracted directory
4. Run the installer:
   ```bash
   sudo ./setup_linux.sh
   ```
5. Follow the on-screen instructions

### Option 2: Manual Installation (For Developers)

1. Clone the repository
2. Navigate to the Background-App directory
3. Run the setup script:
   ```bash
   sudo ./setup_linux.sh
   ```

## Service Management

### Using systemctl

```bash
# Start the service
sudo systemctl start workmatrix.service

# Stop the service
sudo systemctl stop workmatrix.service

# Enable service at boot
sudo systemctl enable workmatrix.service

# Check service status
sudo systemctl status workmatrix.service

# View service logs
sudo journalctl -u workmatrix.service
```

### Service Configuration

The service configuration file is located at `/etc/systemd/system/workmatrix.service`. To modify:

```bash
sudo systemctl edit workmatrix.service
```

## Uninstallation

### Using the Uninstaller

1. Navigate to the installation directory
2. Run the uninstaller:
   ```bash
   sudo ./uninstall_linux.sh
   ```

### Manual Uninstallation

```bash
# Stop and disable the service
sudo systemctl stop workmatrix.service
sudo systemctl disable workmatrix.service

# Remove service file
sudo rm /etc/systemd/system/workmatrix.service

# Remove application files
sudo rm -rf /opt/workmatrix
sudo rm -rf /var/log/workmatrix
sudo userdel -r workmatrix

# Reload systemd
sudo systemctl daemon-reload
```

## Configuration

The service uses a `.env` file for configuration. Create this file in the application directory:

```bash
sudo nano /opt/workmatrix/.env
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
SCREENSHOTS_DIR=/opt/workmatrix/screenshots
RECORDINGS_DIR=/opt/workmatrix/recordings

# Sync Configuration
SYNC_INTERVAL=300  # 5 minutes
```

## Logs

Logs are stored in the following locations:
- Service logs: `/var/log/workmatrix/service.log`
- Error logs: `/var/log/workmatrix/service.err`
- Application logs: `/var/log/workmatrix/workmatrix.log`

View logs using:
```bash
# View service logs
sudo journalctl -u workmatrix.service

# View application logs
sudo tail -f /var/log/workmatrix/workmatrix.log
```

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check Python installation
   - Verify systemd status
   - Check service logs
   - Verify permissions

2. **No data collection**
   - Verify the `.env` file configuration
   - Check network connectivity
   - Verify Supabase credentials
   - Check user permissions

3. **High CPU/Memory usage**
   - Check the sync interval in `.env`
   - Verify collector settings
   - Monitor system resources
   - Check for resource limits

### Log Analysis

1. Use journalctl for system logs:
   ```bash
   sudo journalctl -u workmatrix.service -f
   ```

2. Check application logs:
   ```bash
   sudo tail -f /var/log/workmatrix/workmatrix.log
   ```

3. Check system logs:
   ```bash
   sudo tail -f /var/log/syslog | grep workmatrix
   ```

### Support

For additional support:
1. Check the service logs
2. Contact technical support
3. Submit an issue on GitHub

## Security Considerations

1. **File Permissions**
   - Service runs as dedicated user (workmatrix)
   - Data directories are protected
   - Logs are accessible only to administrators
   - SELinux/AppArmor policies (if enabled)

2. **Network Security**
   - WebSocket communication is encrypted
   - Supabase connection uses secure protocols
   - All API calls are authenticated
   - Firewall rules (if applicable)

3. **Data Protection**
   - Screenshots and recordings are stored locally
   - Data is encrypted during transmission
   - Regular cleanup of old data
   - File system encryption (if enabled)

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
   - Update system packages

2. **Performance**
   - Adjust sync interval as needed
   - Monitor system resources
   - Regular cleanup of old data
   - Optimize system settings

3. **Security**
   - Keep the service updated
   - Monitor access logs
   - Regular security audits
   - Apply security patches

## Development

For developers:
1. Use the manual installation method
2. Enable debug logging
3. Monitor the service in real-time
4. Use virtual environment for testing

## Distribution-Specific Notes

### Ubuntu/Debian
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install python3-venv python3-pip

# Check service status
sudo systemctl status workmatrix.service
```

### CentOS/RHEL
```bash
# Install dependencies
sudo yum install python3 python3-pip

# Check service status
sudo systemctl status workmatrix.service
```

### SELinux Considerations
If SELinux is enabled:
```bash
# Check SELinux status
getenforce

# Set appropriate context
sudo chcon -R system_u:object_r:httpd_sys_content_t:s0 /opt/workmatrix
```

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 