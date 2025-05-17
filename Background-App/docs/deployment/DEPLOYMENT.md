# WorkMatrix Deployment Guide

## Deployment Checklist (May 9-22, 2025)

### Day 1-2: Supabase Setup (May 9-10)
1. **Project Creation**
   - [ ] Create new Supabase project
   - [ ] Save project URL and API keys
   - [ ] Apply database migrations
   - [ ] Create storage bucket

2. **Admin Setup**
   - [ ] Create admin account
   - [ ] Set up RLS policies
   - [ ] Test admin dashboard access

### Day 3-4: Vercel Deployment (May 11-12)
1. **Frontend Setup**
   - [ ] Create Vercel project
   - [ ] Connect GitHub repository
   - [ ] Configure environment variables
   - [ ] Deploy frontend

2. **Testing**
   - [ ] Verify admin dashboard
   - [ ] Test authentication
   - [ ] Check API endpoints

### Day 5-7: Background App (May 13-15)
1. **Initial Setup**
   - [ ] Install on 1-2 test machines
   - [ ] Configure environment variables
   - [ ] Test data collection
   - [ ] Verify Supabase sync

2. **Monitoring**
   - [ ] Set up API monitoring
   - [ ] Configure storage alerts
   - [ ] Test error handling

### Day 8-10: Employee Rollout (May 16-18)
1. **First Wave**
   - [ ] Install on 5 employees
   - [ ] Monitor performance
   - [ ] Address issues

2. **Second Wave**
   - [ ] Install on remaining 5 employees
   - [ ] Verify data sync
   - [ ] Check storage usage

### Day 11-12: Testing (May 19-20)
1. **System Testing**
   - [ ] Test all features
   - [ ] Verify data accuracy
   - [ ] Check API limits
   - [ ] Monitor storage

2. **User Testing**
   - [ ] Test admin features
   - [ ] Verify employee access
   - [ ] Check notifications

### Day 13: Final Steps (May 21)
1. **Documentation**
   - [ ] Update setup guides
   - [ ] Document known issues
   - [ ] Create support contacts

2. **Handover**
   - [ ] Train admin users
   - [ ] Set up monitoring
   - [ ] Document procedures

## API Endpoints

### Activity Logs
```sql
-- Get user's activity logs
SELECT * FROM activity_logs 
WHERE user_id = :user_id 
AND timestamp >= :start_date 
AND timestamp <= :end_date;

-- Get daily summary
SELECT * FROM daily_hours 
WHERE user_id = :user_id 
AND date = :date;
```

### Screenshots
```sql
-- Get user's screenshots
SELECT * FROM screenshots 
WHERE user_id = :user_id 
AND timestamp >= :start_date 
AND timestamp <= :end_date;
```

### Approval Requests
```sql
-- Get pending approvals
SELECT * FROM approval_requests 
WHERE status = 'pending';

-- Update approval status
UPDATE approval_requests 
SET status = :status, 
    reviewed_at = NOW() 
WHERE id = :request_id;
```

## Troubleshooting Guide

### 1. Sync Issues

#### Symptoms
- Data not appearing in dashboard
- High error rate in logs
- Sync failures

#### Solutions
1. **Check Environment**
   ```bash
   # Verify .env file
   cat .env
   # Should show:
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   ```

2. **Check Network**
   ```bash
   # Test Supabase connection
   curl https://your-project.supabase.co/rest/v1/
   ```

3. **Review Logs**
   ```bash
   # Check sync logs
   tail -f data/logs/workmatrix.log
   ```

### 2. Dashboard Issues

#### Symptoms
- Can't log in
- Data not loading
- UI errors

#### Solutions
1. **Clear Cache**
   - Clear browser cache
   - Delete local storage
   - Refresh token

2. **Check API**
   ```bash
   # Test API endpoint
   curl https://your-project.supabase.co/rest/v1/activity_logs
   ```

### 3. Storage Issues

#### Symptoms
- High storage usage
- Sync failures
- Slow performance

#### Solutions
1. **Check Usage**
   ```bash
   # Check local storage
   du -sh data/screenshots/
   ```

2. **Cleanup**
   ```bash
   # Run cleanup
   python src/main.py --cleanup
   ```

3. **Adjust Settings**
   - Reduce screenshot quality
   - Increase cleanup frequency
   - Adjust retention period

## Monitoring

### 1. API Usage
- Check `api_monitor.log` daily
- Alert at 40,000 calls/month
- Monitor sync frequency

### 2. Storage
- Monitor Supabase storage
- Check local storage
- Alert at 450MB usage

### 3. Performance
- Monitor sync times
- Check error rates
- Track response times

## Support Contacts

- **Technical Support**: tech@workmatrix.com
- **Admin Support**: admin@workmatrix.com
- **Emergency**: emergency@workmatrix.com

## Emergency Procedures

1. **Data Loss**
   - Stop sync immediately
   - Check local backups
   - Contact support

2. **API Limit**
   - Reduce sync frequency
   - Clear old data
   - Contact support

3. **Storage Full**
   - Run cleanup
   - Reduce quality
   - Contact support 