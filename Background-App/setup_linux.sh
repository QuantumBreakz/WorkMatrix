#!/bin/bash

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create system user and group
echo "Creating system user..."
if ! id "workmatrix" &>/dev/null; then
    useradd -r -s /bin/false workmatrix
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p /opt/workmatrix
mkdir -p /var/log/workmatrix
mkdir -p /usr/local/bin

# Install Python dependencies
echo "Installing Python dependencies..."
if command -v apt-get &>/dev/null; then
    apt-get update
    apt-get install -y python3-pip python3-venv
elif command -v yum &>/dev/null; then
    yum install -y python3-pip
elif command -v dnf &>/dev/null; then
    dnf install -y python3-pip
else
    echo "Package manager not found. Please install Python 3 and pip manually."
    exit 1
fi

# Create virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv /opt/workmatrix/venv
/opt/workmatrix/venv/bin/pip install --upgrade pip
/opt/workmatrix/venv/bin/pip install -r requirements.txt

# Copy service files
echo "Installing service files..."
cp linux/workmatrix.service /etc/systemd/system/
cp src/linux_service.py /usr/local/bin/workmatrix-service
chmod +x /usr/local/bin/workmatrix-service

# Set permissions
echo "Setting permissions..."
chown -R workmatrix:workmatrix /opt/workmatrix
chown -R workmatrix:workmatrix /var/log/workmatrix
chmod 755 /opt/workmatrix
chmod 755 /var/log/workmatrix

# Enable and start service
echo "Enabling and starting service..."
systemctl daemon-reload
systemctl enable workmatrix.service
systemctl start workmatrix.service

echo "Installation complete!"
echo "To start the service: systemctl start workmatrix.service"
echo "To stop the service: systemctl stop workmatrix.service"
echo "To check status: systemctl status workmatrix.service"
echo "To view logs: journalctl -u workmatrix.service" 