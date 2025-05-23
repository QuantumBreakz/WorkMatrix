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

# Function to check service status
check_service() {
    local user=$1
    local service="workmatrix@${user}"
    
    if systemctl is-active --quiet "$service"; then
        print_status "Service is running"
        return 0
    else
        print_error "Service is not running"
        return 1
    fi
}

# Function to check storage usage
check_storage() {
    local max_storage_mb=450
    local current_storage_mb=$(du -sm data/screenshots 2>/dev/null | cut -f1)
    
    if [ -z "$current_storage_mb" ]; then
        print_error "Could not determine storage usage"
        return 1
    fi
    
    local usage_percent=$((current_storage_mb * 100 / max_storage_mb))
    
    if [ $usage_percent -ge 90 ]; then
        print_error "Storage usage critical: ${current_storage_mb}MB (${usage_percent}%)"
        return 1
    elif [ $usage_percent -ge 75 ]; then
        print_warning "Storage usage high: ${current_storage_mb}MB (${usage_percent}%)"
        return 0
    else
        print_status "Storage usage normal: ${current_storage_mb}MB (${usage_percent}%)"
        return 0
    fi
}

# Function to check log files
check_logs() {
    local log_file="data/logs/workmatrix.log"
    local error_count=$(grep -c "ERROR" "$log_file" 2>/dev/null)
    
    if [ -z "$error_count" ]; then
        print_error "Could not check log file"
        return 1
    fi
    
    if [ $error_count -gt 0 ]; then
        print_warning "Found $error_count errors in log file"
        return 0
    else
        print_status "No errors found in log file"
        return 0
    fi
}

# Function to check API usage
check_api_usage() {
    # This is a placeholder - implement actual API usage check
    # You would need to query Supabase API usage here
    print_warning "API usage check not implemented"
    return 0
}

# Main monitoring function
monitor() {
    display_logo
    print_status "Starting WorkMatrix monitoring..."
    
    # Get current user
    local current_user=$(logname)
    
    # Check service status
    print_status "Checking service status..."
    check_service "$current_user"
    
    # Check storage usage
    print_status "Checking storage usage..."
    check_storage
    
    # Check log files
    print_status "Checking log files..."
    check_logs
    
    # Check API usage
    print_status "Checking API usage..."
    check_api_usage
    
    print_status "Monitoring completed"
}

# Run monitoring
monitor 