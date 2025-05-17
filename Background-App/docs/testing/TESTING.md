# WorkMatrix Testing Plan

## Overview

This testing plan covers the critical components of the WorkMatrix MVP, ensuring reliable operation within Supabase's free-tier limits and optimal performance for 10 employees.

## Test Environment

- Windows 10/11 test machine
- Python 3.8+
- Supabase free tier
- Vercel free tier
- Test employee accounts (2)

## Test Data Management

### 1. Reset Before Testing
Before each test run, reset all test data:
```bash
# Clear local data
rm -rf data/screenshots/*
rm -f data/activity_logs.json
rm -f data/daily_summaries.json

# Reset Supabase tables (if needed)
# Go to SQL Editor in Supabase dashboard and run:
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE daily_hours;
TRUNCATE TABLE screenshots;
```

### 2. Activity Logs
```python
# test_data_generator.py
import json
import random
from datetime import datetime, timedelta

def generate_activity_logs(count=200):
    logs = []
    base_time = datetime.now() - timedelta(hours=24)
    
    for i in range(count):
        timestamp = base_time + timedelta(minutes=i)
        log = {
            "timestamp": timestamp.isoformat(),
            "cpu_percent": random.uniform(10, 90),
            "memory_percent": random.uniform(20, 80),
            "active_window": random.choice(["Chrome", "VS Code", "Terminal"]),
            "elapsed_seconds": 300,
            "idle_seconds": random.randint(0, 300),
            "break_seconds": random.randint(0, 300),
            "mouse_moves": random.randint(0, 100),
            "keystrokes": random.randint(0, 50)
        }
        logs.append(log)
    
    with open("data/activity_logs.json", "w") as f:
        json.dump(logs, f, indent=2)

if __name__ == "__main__":
    generate_activity_logs()
```

### 3. Daily Summaries
```python
# test_summary_generator.py
import json
from datetime import datetime, timedelta

def generate_daily_summaries(days=7):
    summaries = []
    base_date = datetime.now().date()
    
    for i in range(days):
        date = base_date - timedelta(days=i)
        summary = {
            "user_id": "test_employee_1",
            "date": date.isoformat(),
            "total_hours": 8.0,
            "idle_hours": random.uniform(0.5, 2.0),
            "break_hours": random.uniform(0.5, 1.0),
            "productive_hours": 8.0 - random.uniform(0.5, 2.0) - random.uniform(0.5, 1.0)
        }
        summaries.append(summary)
    
    with open("data/daily_summaries.json", "w") as f:
        json.dump(summaries, f, indent=2)

if __name__ == "__main__":
    generate_daily_summaries()
```

## Test Cases

### 1. Activity Tracking

#### 1.1 System Metrics
- [ ] CPU usage tracking
  - Run CPU-intensive task
  - Verify `cpu_percent` in logs
  - Check sync to Supabase
  - Tools: Task Manager, `workmatrix.log`

- [ ] Memory usage tracking
  - Allocate large memory
  - Verify `memory_percent` in logs
  - Check sync to Supabase
  - Tools: Task Manager, `workmatrix.log`

- [ ] Active window tracking
  - Switch between applications
  - Verify `active_window` in logs
  - Check sync to Supabase
  - Tools: `workmatrix.log`, Supabase dashboard

#### 1.2 User Activity
- [ ] Mouse movement tracking
  - Move mouse for 5 minutes
  - Verify `mouse_moves` in logs
  - Check sync to Supabase
  - Tools: `workmatrix.log`, Supabase dashboard

- [ ] Keystroke tracking
  - Type for 5 minutes
  - Verify `keystrokes` in logs
  - Check sync to Supabase
  - Tools: `workmatrix.log`, Supabase dashboard

#### 1.3 Time Tracking
- [ ] Idle detection
  - Leave system idle for 5 minutes
  - Verify `is_idle` in logs
  - Check sync to Supabase
  - Tools: `workmatrix.log`, Supabase dashboard

- [ ] Break tracking
  - Toggle break state
  - Verify `is_break` in logs
  - Check sync to Supabase
  - Tools: `workmatrix.log`, Supabase dashboard

### 2. Screenshot Capture

#### 2.1 Basic Functionality
- [ ] Automatic capture
  - Wait for 5-minute interval
  - Verify screenshot saved
  - Check file format (WebP)
  - Tools: File Explorer, `data/screenshots/`

- [ ] Compression
  - Capture large window
  - Verify file size < 500KB
  - Check image quality
  - Tools: File Explorer, Image viewer

#### 2.2 Storage Management
- [ ] Local storage
  - Capture 100 screenshots
  - Verify directory size
  - Check cleanup
  - Tools: `du -sh data/screenshots/`

- [ ] Supabase storage
  - Sync screenshots
  - Verify bucket size
  - Check cleanup
  - Tools: Supabase Storage dashboard

### 3. Data Sync

#### 3.1 Activity Logs
- [ ] Batch syncing
  - Generate 200 logs using `test_data_generator.py`
  - Verify sync in batches of 100
  - Check API calls
  - Tools: `api_monitor.log`, Supabase dashboard

- [ ] Error handling
  - Simulate network error
  - Verify retry logic
  - Check error logs
  - Tools: `workmatrix.log`, Network monitor

#### 3.2 Daily Summaries
- [ ] Summary computation
  - Generate 24 hours of logs
  - Verify daily summary
  - Check `productive_hours`
  - Tools: `daily_summaries.json`, Supabase dashboard

- [ ] Sync to Supabase
  - Compute summaries
  - Verify sync
  - Check data accuracy
  - Tools: Supabase dashboard, SQL Editor

### 4. API Usage

#### 4.1 Call Limits
- [ ] Daily limit
  - Monitor `api_calls.json`
  - Verify < 1500 calls/day
  - Check alerts
  - Tools: `api_monitor.log`, Supabase dashboard

- [ ] Monthly limit
  - Monitor `api_monitor.log`
  - Verify < 50,000 calls/month
  - Check warnings
  - Tools: `api_monitor.log`, Supabase dashboard

#### 4.2 Optimization
- [ ] Batch size
  - Test different batch sizes
  - Verify optimal size (100)
  - Check performance
  - Tools: `api_monitor.log`, Network monitor

- [ ] Sync frequency
  - Test different intervals
  - Verify 30-minute interval
  - Check API usage
  - Tools: `api_monitor.log`, Supabase dashboard

### 5. Storage Management

#### 5.1 Local Storage
- [ ] Screenshot cleanup
  - Fill storage to 450MB
  - Verify cleanup
  - Check retention
  - Tools: `du -sh data/screenshots/`

- [ ] Log cleanup
  - Generate 30 days of logs
  - Verify cleanup
  - Check retention
  - Tools: `workmatrix.log`, File Explorer

#### 5.2 Supabase Storage
- [ ] Bucket management
  - Upload 100 screenshots
  - Verify bucket size
  - Check cleanup
  - Tools: Supabase Storage dashboard

- [ ] Database cleanup
  - Generate 30 days of data
  - Verify cleanup
  - Check retention
  - Tools: Supabase dashboard, SQL Editor

### 6. Frontend Integration

#### 6.1 Admin Dashboard
- [ ] Activity view
  - View employee activity
  - Verify data accuracy
  - Check filters
  - Tools: Browser DevTools, Supabase dashboard

- [ ] Screenshot view
  - View employee screenshots
  - Verify image quality
  - Check date filter
  - Tools: Browser DevTools, Image viewer

#### 6.2 Employee Dashboard
- [ ] Activity summary
  - View daily summary
  - Verify `productive_hours`
  - Check charts
  - Tools: Browser DevTools, Supabase dashboard

- [ ] Screenshot gallery
  - View own screenshots
  - Verify access
  - Check filters
  - Tools: Browser DevTools, Supabase dashboard

#### 6.3 RLS Policy Enforcement
- [ ] Employee Access Control
  - Test employee login
  - Verify can only view own:
    - Activity logs
    - Screenshots
    - Daily summaries
  - Attempt to access other data
  - Verify access denied
  - Tools: Browser DevTools, Supabase dashboard

- [ ] Admin Access Control
  - Test admin login
  - Verify can view:
    - All employee data
    - All screenshots
    - All summaries
  - Test approval requests
  - Verify full access
  - Tools: Supabase dashboard, Browser DevTools

- [ ] Policy Verification
  - Check RLS policies:
    ```sql
    -- In Supabase SQL Editor
    SELECT * FROM pg_policies;
    ```
  - Verify policies for:
    - activity_logs
    - daily_hours
    - screenshots
  - Test policy changes
  - Verify enforcement
  - Tools: Supabase dashboard, SQL Editor

## Test Execution

### 1. Setup
1. Install app on test machine
2. Configure test environment
3. Create test accounts
4. Reset test data
5. Run test data generators

### 2. Execution
1. Run test cases in order
2. Document results
3. Log issues
4. Verify with tools

### 3. Verification
1. Check logs
2. Verify Supabase data
3. Test frontend
4. Monitor resources

## Success Criteria

### 1. Performance
- API calls < 50,000/month
- Storage < 500MB
- Sync time < 30 seconds

### 2. Reliability
- 99% sync success
- < 1% error rate
- No data loss

### 3. Usability
- Clear dashboard views
- Accurate time tracking
- Reliable screenshots

## Issue Tracking

### 1. Critical
- Data loss
- Sync failures
- API limit exceeded

### 2. High
- High error rate
- Slow performance
- Storage issues

### 3. Medium
- UI glitches
- Minor delays
- Warning messages

## Reporting

### 1. Daily Report
- Test cases run
- Issues found
- API usage

### 2. Weekly Report
- Performance metrics
- Storage usage
- Error rates

### 3. Final Report
- Test coverage
- Known issues
- Recommendations 