#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Create directory structure
mkdir -p "$PROJECT_ROOT/src/services"
mkdir -p "$PROJECT_ROOT/src/utils"
mkdir -p "$PROJECT_ROOT/src/config"
mkdir -p "$PROJECT_ROOT/scripts/linux"
mkdir -p "$PROJECT_ROOT/scripts/windows"
mkdir -p "$PROJECT_ROOT/docs/deployment"
mkdir -p "$PROJECT_ROOT/docs/monitoring"
mkdir -p "$PROJECT_ROOT/docs/testing"
mkdir -p "$PROJECT_ROOT/data/logs"
mkdir -p "$PROJECT_ROOT/data/backups"

# Move source files
mv "$PROJECT_ROOT/monitor_api.py" "$PROJECT_ROOT/src/services/" 2>/dev/null
mv "$PROJECT_ROOT/storage_manager.py" "$PROJECT_ROOT/src/services/" 2>/dev/null
mv "$PROJECT_ROOT/supabase_sync.py" "$PROJECT_ROOT/src/services/" 2>/dev/null
mv "$PROJECT_ROOT/config.py" "$PROJECT_ROOT/src/config/" 2>/dev/null
mv "$PROJECT_ROOT/database.py" "$PROJECT_ROOT/src/utils/" 2>/dev/null
mv "$PROJECT_ROOT/init_supabase.py" "$PROJECT_ROOT/src/utils/" 2>/dev/null

# Move script files
mv "$PROJECT_ROOT/start.sh" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null
mv "$PROJECT_ROOT/setup.sh" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null
mv "$PROJECT_ROOT/monitor.sh" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null
mv "$PROJECT_ROOT/uninstall_service.sh" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null
mv "$PROJECT_ROOT/backup.sh" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null
mv "$PROJECT_ROOT/workmatrix.service" "$PROJECT_ROOT/scripts/linux/" 2>/dev/null

mv "$PROJECT_ROOT/start.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null
mv "$PROJECT_ROOT/setup.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null
mv "$PROJECT_ROOT/monitor.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null
mv "$PROJECT_ROOT/uninstall_windows_service.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null
mv "$PROJECT_ROOT/install_windows_service.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null
mv "$PROJECT_ROOT/backup.bat" "$PROJECT_ROOT/scripts/windows/" 2>/dev/null

# Move documentation
mv "$PROJECT_ROOT/DEPLOYMENT.md" "$PROJECT_ROOT/docs/deployment/" 2>/dev/null
mv "$PROJECT_ROOT/DEPLOYMENT_CHECKLIST.md" "$PROJECT_ROOT/docs/deployment/" 2>/dev/null
mv "$PROJECT_ROOT/ROLLOUT.md" "$PROJECT_ROOT/docs/deployment/" 2>/dev/null
mv "$PROJECT_ROOT/MONITORING.md" "$PROJECT_ROOT/docs/monitoring/" 2>/dev/null
mv "$PROJECT_ROOT/SERVICE_MANAGEMENT.md" "$PROJECT_ROOT/docs/monitoring/" 2>/dev/null
mv "$PROJECT_ROOT/TESTING.md" "$PROJECT_ROOT/docs/testing/" 2>/dev/null

# Move logs
mv "$PROJECT_ROOT/workmatrix.log" "$PROJECT_ROOT/data/logs/" 2>/dev/null

# Remove redundant files and directories
rm -f "$PROJECT_ROOT/start_workmatrix.sh" 2>/dev/null
rm -rf "$PROJECT_ROOT/src/{services,utils,config}" 2>/dev/null
rm -rf "$PROJECT_ROOT/scripts/{linux,windows}" 2>/dev/null
rm -rf "$PROJECT_ROOT/docs/{deployment,monitoring,testing}" 2>/dev/null

# Make scripts executable
chmod +x "$PROJECT_ROOT/scripts/linux/"*.sh 2>/dev/null
chmod +x "$PROJECT_ROOT/scripts/windows/"*.bat 2>/dev/null

echo "Files have been moved to their new locations." 