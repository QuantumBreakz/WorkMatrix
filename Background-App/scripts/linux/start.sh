#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$SCRIPT_DIR/../.."

cd "$APP_ROOT"

# Function to check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
        exit 1
    fi
}

# Function to check if virtual environment exists
check_venv() {
    if [ ! -d "venv" ]; then
        echo -e "${GREEN}Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
}

# Function to activate virtual environment and install dependencies
setup_venv() {
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source venv/bin/activate
    
    echo -e "${GREEN}Installing/Updating dependencies...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
}

# Function to check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${RED}.env file not found in $APP_ROOT. Please create one with your Supabase credentials.${NC}"
        exit 1
    fi
}

# Function to start the application
start_app() {
    echo -e "${GREEN}Starting WorkMatrix Background App...${NC}"
    source venv/bin/activate
    set -a
    source .env
    set +a
    python3 src/main.py
}

# Main execution
echo -e "${GREEN}Initializing WorkMatrix Background App...${NC}"

# Check requirements
check_python
check_venv
check_env

# Setup environment
setup_venv

# Ensure log directory exists
mkdir -p data/logs

# Install the package in development mode from the project root
pip install -e .

# Start the application
start_app 