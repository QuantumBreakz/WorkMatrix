#!/bin/bash

set -e

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

# Check if Python 3.8+ is installed
check_python() {
    if command -v python3 &>/dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        if [ "$(printf '%s\n' "3.8" "$PYTHON_VERSION" | sort -V | head -n1)" = "3.8" ]; then
            print_status "Python $PYTHON_VERSION is installed"
            return 0
        else
            print_error "Python 3.8 or higher is required"
            return 1
        fi
    else
        print_error "Python 3 is not installed"
        return 1
    fi
}

# Create virtual environment
setup_venv() {
    print_status "Setting up virtual environment..."
    mkdir -p data/screenshots
    mkdir -p data/recordings
    mkdir -p data/logs
    python3 -m venv venv
    source venv/bin/activate
    print_status "Virtual environment created"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    print_status "Dependencies installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p data/screenshots
    mkdir -p data/recordings
    mkdir -p data/logs
    print_status "Directories created"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        cat > .env << EOL
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Application Settings
SCREENSHOT_INTERVAL=300  # 5 minutes in seconds
SYNC_INTERVAL=1800      # 30 minutes in seconds
MAX_STORAGE_MB=450      # Maximum local storage in MB
EOL
        print_warning "Created .env file. Please update with your Supabase credentials"
    else
        print_status ".env file already exists"
    fi
}

# Check if running as admin
check_admin() {
    if [ "$EUID" -ne 0 ]; then
        print_warning "Please run this script as administrator for full functionality"
        return 1
    fi
    return 0
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    # Get the absolute path of the current directory
    CURRENT_DIR=$(pwd)
    
    # Create the startup script
    cat > start_workmatrix.sh << EOL
#!/bin/bash
cd "$CURRENT_DIR"
source venv/bin/activate
python src/main.py
EOL
    
    # Make it executable
    chmod +x start_workmatrix.sh
    print_status "Startup script created"
}

# Install systemd service
install_service() {
    print_status "Installing systemd service..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root to install the service"
        return 1
    fi
    
    # Get current user
    CURRENT_USER=$(logname)
    
    # Copy service file
    cp workmatrix.service /etc/systemd/system/workmatrix@${CURRENT_USER}.service
    
    # Create user's workmatrix directory
    mkdir -p /home/${CURRENT_USER}/workmatrix
    cp -r ./* /home/${CURRENT_USER}/workmatrix/
    chown -R ${CURRENT_USER}:${CURRENT_USER} /home/${CURRENT_USER}/workmatrix
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable and start service
    systemctl enable workmatrix@${CURRENT_USER}
    systemctl start workmatrix@${CURRENT_USER}
    
    print_status "Service installed and started"
}

# Main installation process
main() {
    display_logo
    print_status "Starting WorkMatrix installation..."
    
    # Check Python version
    check_python || exit 1
    
    # Create virtual environment
    setup_venv || exit 1
    
    # Install dependencies
    install_dependencies || exit 1
    
    # Create directories
    create_directories || exit 1
    
    # Setup environment variables
    setup_env || exit 1
    
    # Create startup script
    create_startup_script || exit 1
    
    # Install service if running as root
    if [ "$EUID" -eq 0 ]; then
        install_service
    else
        print_warning "Run 'sudo ./setup.sh' to install as a system service"
    fi
    
    print_status "Installation completed successfully!"
    print_warning "Please update the .env file with your Supabase credentials"
    print_status "To start the application manually, run: ./start_workmatrix.sh"
}

# Run the main function
main 