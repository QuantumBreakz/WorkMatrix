# WorkMatrix Service Management Guide

This guide provides instructions for managing the WorkMatrix background service on both Windows and Linux systems.

## Table of Contents
1. [Service Overview](#service-overview)
2. [Windows Management](#windows-management)
3. [Linux Management](#linux-management)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Common Issues](#common-issues)

## Service Overview

The WorkMatrix service runs in the background to:
- Capture screenshots every 5 minutes
- Track system activity
- Sync data to Supabase every 30 minutes
- Manage local storage (max 450MB)

## Windows Management

### Starting the Service
```cmd
net start WorkMatrix
```

### Stopping the Service
```cmd
net stop WorkMatrix
```

### Checking Service Status
```cmd
sc query WorkMatrix
```

### Viewing Service Logs
- Main log: `data\logs\workmatrix.log`
- Service log: `data\logs\service.log`
- Error log: `data\logs\service_error.log`

### Using the Monitoring Script
```cmd
monitor.bat
```
This script checks:
- Service status
- Storage usage
- Error logs
- API usage

## Linux Management

### Starting the Service
```bash
sudo systemctl start workmatrix@$USER
```

### Stopping the Service
```bash
sudo systemctl stop workmatrix@$USER
```

### Checking Service Status
```bash
systemctl status workmatrix@$USER
```

### Viewing Service Logs
```bash
journalctl -u workmatrix@$USER
```
Or check the log file:
```bash
tail -f data/logs/workmatrix.log
```

### Using the Monitoring Script
```bash
./monitor.sh
```
This script checks:
- Service status
- Storage usage
- Error logs
- API usage

## Monitoring

### Storage Limits
- Maximum local storage: 450MB
- Warning at 75% usage (337.5MB)
- Critical at 90% usage (405MB)

### API Usage
- Free tier limit: 50,000 calls/month
- Monitor usage in Supabase dashboard
- Check `monitor.sh` or `monitor.bat` for current usage

### Log Files
- Check for errors in `data/logs/workmatrix.log`
- Logs rotate at 10MB
- Keeps 30 days of history

## Troubleshooting

### Service Won't Start
1. Check Python installation:
   ```bash
   python --version  # Should be 3.8+
   ```
2. Verify virtual environment:
   ```bash
   source venv/bin/activate  # Linux
   venv\Scripts\activate.bat  # Windows
   ```
3. Check dependencies:
   ```bash
   pip list
   ```

### Storage Issues
1. Check current usage:
   ```bash
   du -sh data/screenshots  # Linux
   dir /s data\screenshots  # Windows
   ```
2. Clean up old screenshots if needed
3. Verify MAX_STORAGE_MB in .env

### Sync Problems
1. Check Supabase credentials in .env
2. Verify network connectivity
3. Check API usage limits

## Common Issues

### Windows
1. **Service fails to start**
   - Run as Administrator
   - Check Event Viewer
   - Verify Python path

2. **High CPU usage**
   - Check screenshot interval
   - Monitor process in Task Manager
   - Adjust SCREENSHOT_INTERVAL in .env

3. **Storage full**
   - Run cleanup script
   - Adjust MAX_STORAGE_MB
   - Check screenshot quality

### Linux
1. **Permission denied**
   - Check user permissions
   - Verify directory ownership
   - Run with sudo if needed

2. **Service not found**
   - Check service name
   - Verify installation
   - Reinstall if needed

3. **Log rotation issues**
   - Check disk space
   - Verify log permissions
   - Adjust rotation settings

## Support

For additional help:
1. Check the logs in `data/logs/`
2. Run the monitoring script
3. Contact system administrator
4. Review Supabase dashboard

## Best Practices

1. **Regular Monitoring**
   - Run monitor script daily
   - Check storage usage
   - Review error logs

2. **Maintenance**
   - Keep Python updated
   - Regular log review
   - Backup important data

3. **Security**
   - Secure .env file
   - Regular password updates
   - Monitor API usage

4. **Performance**
   - Monitor CPU usage
   - Check memory usage
   - Optimize screenshot quality 