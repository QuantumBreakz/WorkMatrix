#!/bin/bash

# Create directory structure
mkdir -p scripts/{linux,windows}
mkdir -p docs/{deployment,monitoring,testing}
mkdir -p src/{services,utils,config}
mkdir -p data/{logs,backups}
mkdir -p tests

# Move script files
mv start.sh scripts/linux/
mv setup.sh scripts/linux/
mv monitor.sh scripts/linux/
mv uninstall_service.sh scripts/linux/
mv backup.sh scripts/linux/

mv start.bat scripts/windows/
mv setup.bat scripts/windows/
mv monitor.bat scripts/windows/
mv uninstall_windows_service.bat scripts/windows/
mv install_windows_service.bat scripts/windows/
mv backup.bat scripts/windows/

# Move documentation
mv DEPLOYMENT.md docs/deployment/
mv DEPLOYMENT_CHECKLIST.md docs/deployment/
mv ROLLOUT.md docs/deployment/
mv MONITORING.md docs/monitoring/
mv SERVICE_MANAGEMENT.md docs/monitoring/
mv TESTING.md docs/testing/

# Move service files
mv workmatrix.service scripts/linux/

# Move source files
mv monitor_api.py src/services/
mv storage_manager.py src/services/
mv supabase_sync.py src/services/
mv config.py src/config/
mv database.py src/utils/
mv init_supabase.py src/utils/

# Move test files
mv tests/* tests/

# Move logs
mv workmatrix.log data/logs/

# Clean up redundant files
rm -f start_workmatrix.sh  # redundant with start.sh

# Make scripts executable
chmod +x scripts/linux/*.sh
chmod +x scripts/windows/*.bat

echo "Files have been organized into appropriate directories." 