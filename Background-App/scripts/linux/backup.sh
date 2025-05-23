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

# Function to create backup directory
create_backup_dir() {
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    echo "$backup_dir"
}

# Function to backup Supabase data
backup_supabase() {
    local backup_dir=$1
    
    # Load environment variables
    if [ -f .env ]; then
        source .env
    else
        print_error "No .env file found"
        return 1
    fi
    
    # Check if Supabase credentials are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
        print_error "Supabase credentials not found in .env"
        return 1
    fi
    
    # Create backup file
    local backup_file="$backup_dir/supabase_backup.sql"
    
    # Export data using Supabase CLI
    print_status "Exporting Supabase data..."
    supabase db dump --db-url "$SUPABASE_URL" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_status "Supabase backup created: $backup_file"
        return 0
    else
        print_error "Failed to create Supabase backup"
        return 1
    fi
}

# Function to backup local data
backup_local_data() {
    local backup_dir=$1
    
    # Create data backup
    print_status "Backing up local data..."
    
    # Backup screenshots
    if [ -d "data/screenshots" ]; then
        cp -r data/screenshots "$backup_dir/"
    fi
    
    # Backup logs
    if [ -d "data/logs" ]; then
        cp -r data/logs "$backup_dir/"
    fi
    
    # Backup .env
    if [ -f ".env" ]; then
        cp .env "$backup_dir/"
    fi
    
    print_status "Local data backup created in $backup_dir"
}

# Function to clean old backups
clean_old_backups() {
    local max_backups=30  # Keep last 30 days of backups
    
    print_status "Cleaning old backups..."
    
    # List backups by date, newest first
    local backups=($(ls -t backups/ 2>/dev/null))
    
    # Remove old backups
    if [ ${#backups[@]} -gt $max_backups ]; then
        for ((i=max_backups; i<${#backups[@]}; i++)); do
            rm -rf "backups/${backups[$i]}"
        done
        print_status "Removed ${#backups[@]}-$max_backups old backups"
    else
        print_status "No old backups to clean"
    fi
}

# Main backup function
backup() {
    display_logo
    print_status "Starting WorkMatrix backup..."
    
    # Create backup directory
    local backup_dir=$(create_backup_dir)
    if [ -z "$backup_dir" ]; then
        print_error "Failed to create backup directory"
        return 1
    fi
    
    # Backup Supabase data
    backup_supabase "$backup_dir"
    
    # Backup local data
    backup_local_data "$backup_dir"
    
    # Clean old backups
    clean_old_backups
    
    print_status "Backup completed successfully"
}

# Run backup
backup 