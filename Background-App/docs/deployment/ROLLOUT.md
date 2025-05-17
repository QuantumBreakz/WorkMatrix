# WorkMatrix MVP Rollout Guide

## 1. Account Creation

### 1.1 Admin Account
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Go to Authentication > Users
3. Click "Invite User"
4. Enter admin email (e.g., admin@yourcompany.com)
5. Set temporary password
6. After admin logs in, update role:
   ```sql
   UPDATE public.users
   SET role = 'admin'
   WHERE email = 'admin@yourcompany.com';
   ```

### 1.2 Employee Accounts
1. Go to Authentication > Users
2. For each employee:
   - Click "Invite User"
   - Enter employee email
   - Set temporary password
   - Note: They'll receive an email to set their password
3. After employees log in, update roles:
   ```sql
   -- Run for each employee
   UPDATE public.users
   SET role = 'employee'
   WHERE email = 'employee@yourcompany.com';
   ```

## 2. Background App Installation

### 2.1 Prerequisites
- Windows 10/11
- Python 3.8+
- Git (for updates)

### 2.2 Installation Steps
1. Download `install.bat` and `run.bat`
2. Run `install.bat` as administrator
3. Verify:
   - Python installation
   - Dependencies
   - .env file
   - Startup shortcut

### 2.3 Configuration
1. Open `.env` file
2. Set environment variables:
   ```
   SUPABASE_URL=<your-project-url>
   SUPABASE_KEY=<your-service-role-key>
   WORKMATRIX_USER_ID=<employee-id>
   ```
3. Save and close

### 2.4 Verification
1. Run app manually:
   ```bash
   python src/main.py
   ```
2. Check `workmatrix.log` for:
   - Successful startup
   - Activity collection
   - Screenshot capture
   - Supabase sync

## 3. Phased Rollout

### 3.1 Phase 1 (1-2 employees)
1. Select 1-2 employees for testing
2. Create their accounts in Supabase
3. Install background app on their machines
4. Monitor for 24 hours:
   - Check `workmatrix.log`
   - Verify screenshots
   - Monitor API usage
5. Verify dashboard data

### 3.2 Phase 2 (All employees)
1. Create remaining employee accounts
2. Schedule installations:
   - Send installation guide
   - Set up remote support
   - Verify each installation
3. Monitor system:
   - Check API usage
   - Verify storage
   - Review logs

## 4. Troubleshooting

### 4.1 App Not Syncing
1. Check internet connection
2. Verify Supabase credentials in `.env`
3. Check `workmatrix.log` for errors
4. Verify API usage limits

### 4.2 Login Failures
1. Check email/password
2. Verify account exists in Supabase
3. Check role assignment
4. Clear browser cache

### 4.3 Hotkey Issues
1. Verify app is running
2. Check `workmatrix.log` for errors
3. Try restarting app
4. Verify keyboard layout

### 4.4 Screenshot Problems
1. Check storage space
2. Verify screenshot permissions
3. Check compression settings
4. Review `workmatrix.log`

## 5. Support

### 5.1 Contact Information
- Technical Support: [Your Support Email]
- Admin Support: [Admin Email]
- Emergency: [Emergency Contact]

### 5.2 Logs Location
- `workmatrix.log`: Main application log
- `api_monitor.log`: API usage tracking
- Supabase Dashboard: Storage and database

### 5.3 Common Commands
```bash
# Check app status
tasklist | findstr python

# View logs
type workmatrix.log
type api_monitor.log

# Restart app
taskkill /F /IM python.exe
python src/main.py
``` 