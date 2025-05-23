#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display logo
display_logo() {
    echo -e "${BLUE}"
    echo "██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗"
    echo "██║    ██║██╔═══██╗██╔══██╗██║  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝"
    echo "██║ █╗ ██║██║   ██║██████╔╝███████║██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ "
    echo "██║███╗██║██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ "
    echo "╚███╔███╔╝╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗"
    echo " ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝"
    echo -e "${NC}"
}

# Function to print status messages
print_status() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root"
    exit 1
fi

display_logo
print_status "Starting WorkMatrix uninstallation..."

# Get current user
CURRENT_USER=$(logname)
SERVICE_NAME="workmatrix@${CURRENT_USER}"

# Stop and disable the service
print_status "Stopping WorkMatrix service..."
systemctl stop "$SERVICE_NAME" 2>/dev/null
if [ $? -ne 0 ]; then
    print_warning "Service was not running"
fi

print_status "Disabling WorkMatrix service..."
systemctl disable "$SERVICE_NAME" 2>/dev/null

# Remove service file
print_status "Removing service file..."
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload

# Clean up files
print_status "Cleaning up files..."
if [ -f "start_workmatrix.sh" ]; then
    rm -f "start_workmatrix.sh"
fi

if [ -d "data/logs" ]; then
    rm -f "data/logs/service.log"
    rm -f "data/logs/service_error.log"
fi

print_status "Uninstallation completed successfully!"
exit 0 