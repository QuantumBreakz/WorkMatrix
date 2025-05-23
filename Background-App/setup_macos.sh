#!/bin/bash

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p /Library/Application\ Support/WorkMatrix
mkdir -p /Library/Logs/WorkMatrix
mkdir -p /usr/local/bin

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Copy service files
echo "Installing service files..."
cp macos/com.workmatrix.service.plist /Library/LaunchDaemons/
cp src/macos_service.py /usr/local/bin/workmatrix-service
chmod +x /usr/local/bin/workmatrix-service

# Set permissions
echo "Setting permissions..."
chown -R root:wheel /Library/Application\ Support/WorkMatrix
chown -R root:wheel /Library/Logs/WorkMatrix
chmod 755 /Library/Application\ Support/WorkMatrix
chmod 755 /Library/Logs/WorkMatrix

# Load the service
echo "Loading service..."
launchctl load /Library/LaunchDaemons/com.workmatrix.service.plist

echo "Installation complete!"
echo "To start the service: launchctl start com.workmatrix.service"
echo "To stop the service: launchctl stop com.workmatrix.service"
echo "To check status: launchctl list | grep workmatrix" 