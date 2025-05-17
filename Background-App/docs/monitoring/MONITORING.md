# WorkMatrix MVP Monitoring Plan

## 1. API Usage Monitoring

### 1.1 Weekly Checks
1. Review `api_monitor.log`:
   ```bash
   type api_monitor.log | findstr "API calls"
   ```
2. Check Supabase Dashboard:
   - Go to Project Settings > API
   - Review "API Requests" graph
   - Verify < 50,000 calls/month

### 1.2 API Call Breakdown
- Screenshots: ~1,440 calls/day (30-min intervals)
- Activity Logs: ~1,440 calls/day (30-min intervals)
- Daily Hours: ~48 calls/day (hourly sync)
- Total: ~2,928 calls/day (~31,860/month)

### 1.3 Handling API Overages
If approaching 40,000 calls/month:
1. Reduce sync frequency:
   - Screenshots: 1/hour (720/day)
   - Activity Logs: 1/hour (720/day)
   - Daily Hours: 24/day
   - New total: ~1,464 calls/day (~15,912/month)

2. Increase batch sizes:
   - Activity logs: 100 per batch
   - Screenshots: 10 per batch

3. Optimize queries:
   - Use selective column queries
   - Add appropriate indexes
   - Cache frequently accessed data

## 2. Storage Monitoring

### 2.1 Weekly Checks
1. Check Supabase Storage:
   - Go to Storage > Buckets
   - Review "screenshots" bucket
   - Verify < 500MB total

2. Check Local Storage:
   ```bash
   dir /s /a data\screenshots
   ```

### 2.2 Storage Usage Breakdown
- Screenshots: ~100KB each (compressed)
- 10 employees × 48 screenshots/day = 480 screenshots
- Daily storage: ~48MB
- Monthly storage: ~1.44GB (before cleanup)

### 2.3 Handling Storage Overages
If approaching 450MB:
1. Increase compression:
   - Reduce quality to 40%
   - Target size: 50KB per screenshot
   - New daily storage: ~24MB

2. Increase cleanup frequency:
   - Run cleanup daily
   - Keep only 15 days of data
   - Target storage: ~360MB

3. Archive old data:
   - Export to local backup
   - Delete from Supabase
   - Keep backup for 90 days

## 3. Performance Monitoring

### 3.1 Daily Checks
1. Review `workmatrix.log`:
   ```bash
   type workmatrix.log | findstr "Error"
   type workmatrix.log | findstr "Warning"
   ```

2. Check sync times:
   ```bash
   type workmatrix.log | findstr "Synced"
   ```

### 3.2 Resource Usage
1. Monitor CPU usage:
   ```bash
   tasklist /FI "IMAGENAME eq python.exe" /V
   ```

2. Check memory usage:
   ```bash
   wmic process where name="python.exe" get WorkingSetSize
   ```

### 3.3 Performance Optimization
If issues detected:
1. Reduce screenshot quality
2. Increase sync intervals
3. Optimize database queries
4. Add appropriate indexes

## 4. Alert Thresholds

### 4.1 API Usage
- Warning: 40,000 calls/month
- Critical: 45,000 calls/month
- Action: Reduce sync frequency

### 4.2 Storage Usage
- Warning: 450MB total
- Critical: 475MB total
- Action: Increase compression

### 4.3 Performance
- Warning: Sync time > 30s
- Critical: Sync time > 60s
- Action: Optimize queries

## 5. Monitoring Tools

### 5.1 Built-in Tools
- `api_monitor.py`: API call tracking
- `storage_manager.py`: Storage monitoring
- `workmatrix.log`: Application logging

### 5.2 External Tools
- Supabase Dashboard
- Windows Task Manager
- PowerShell scripts

### 5.3 Custom Scripts
```powershell
# Check API usage
Get-Content api_monitor.log | Select-String "API calls"

# Check storage
Get-ChildItem -Path "data\screenshots" -Recurse | Measure-Object -Property Length -Sum

# Check errors
Get-Content workmatrix.log | Select-String "Error"
```

## 6. Response Plan

### 6.1 API Overages
1. Reduce sync frequency
2. Increase batch sizes
3. Optimize queries
4. Monitor for 24 hours

### 6.2 Storage Overages
1. Increase compression
2. Run cleanup
3. Archive old data
4. Monitor for 24 hours

### 6.3 Performance Issues
1. Check resource usage
2. Review error logs
3. Optimize code
4. Monitor for 24 hours

## 7. Reporting

### 7.1 Daily Report
- API calls
- Storage usage
- Error count
- Sync times

### 7.2 Weekly Report
- Usage trends
- Performance metrics
- Error patterns
- Optimization suggestions

### 7.3 Monthly Review
- API usage patterns
- Storage growth
- Performance trends
- Cost optimization 