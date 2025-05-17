# WorkMatrix Deployment Checklist (May 9-22, 2025)

## Day 1-2: Supabase Setup (May 9-10)

### 1. Project Creation
- [ ] Create new Supabase project
  - Go to https://app.supabase.com
  - Click "New Project"
  - Name: "workmatrix-mvp"
  - Region: Choose closest to team
  - Database Password: Generate secure password
  - Save project URL and API keys

### 2. Database Setup
- [ ] Apply initial migration
  - Copy `supabase/migrations/001_initial_setup.sql`
  - Go to SQL Editor in Supabase dashboard
  - Paste and run migration
  - Verify tables created:
    - `activity_logs`
    - `daily_hours`
    - `screenshots`
    - `approval_requests`

### 3. Storage Setup
- [ ] Create screenshots bucket
  - Go to Storage in dashboard
  - Create bucket named "screenshots"
  - Set to public
  - Enable image transformations
  - Apply RLS policies

### 4. Admin Setup
- [ ] Create admin account
  - Go to Authentication
  - Create admin user
  - Set up admin role
- [ ] Configure RLS policies
  - Verify table policies
  - Test admin access
  - Document policy changes

## Day 3-4: Vercel Deployment (May 11-12)

### 1. Frontend Setup
- [ ] Create Vercel project
  - Go to https://vercel.com
  - Import GitHub repository
  - Select "Front-End" directory
- [ ] Configure environment
  - Add environment variables:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
  - Set build settings
  - Deploy frontend

### 2. Testing
- [ ] Verify deployment
  - Check admin dashboard
  - Test authentication
  - Verify API endpoints
  - Test image uploads

## Day 5-7: Background App (May 13-15)

### 1. Initial Setup
- [ ] Install on test machines (1-2)
  - Clone repository
  - Install dependencies
  - Configure `.env`
  - Test data collection
- [ ] Verify Supabase sync
  - Check activity logs
  - Verify screenshots
  - Monitor API usage

### 2. Monitoring Setup
- [ ] Configure alerts
  - Set up API monitoring
  - Configure storage alerts
  - Test error handling
  - Document procedures

## Day 8-10: Employee Rollout (May 16-18)

### 1. First Wave (5 employees)
- [ ] Install background app
  - Deploy to 5 machines
  - Configure environment
  - Test data collection
- [ ] Monitor performance
  - Check sync status
  - Verify storage usage
  - Address issues

### 2. Second Wave (5 employees)
- [ ] Install background app
  - Deploy to remaining machines
  - Configure environment
  - Test data collection
- [ ] Verify system
  - Check all syncs
  - Monitor storage
  - Test dashboard

## Day 11-12: Testing (May 19-20)

### 1. System Testing
- [ ] Test all features
  - Activity tracking
  - Screenshot capture
  - Data sync
  - Dashboard views
- [ ] Verify limits
  - Check API usage
  - Monitor storage
  - Test cleanup

### 2. User Testing
- [ ] Test admin features
  - Approval requests
  - Screenshot viewing
  - Activity reports
- [ ] Test employee features
  - Dashboard access
  - Screenshot viewing
  - Activity summary

## Day 13: Final Steps (May 21)

### 1. Documentation
- [ ] Update guides
  - Review README.md
  - Update DEPLOYMENT.md
  - Finalize TESTING.md
- [ ] Document issues
  - List known issues
  - Add workarounds
  - Create support contacts

### 2. Handover
- [ ] Train admin users
  - Dashboard usage
  - Approval process
  - Monitoring
- [ ] Set up support
  - Document procedures
  - Create support contacts
  - Set up monitoring

## Day 14: Final Verification (May 22)

### 1. System Stability
- [ ] Check dashboard functionality
  - Admin dashboard
  - Employee dashboard
  - Approval requests
  - Screenshot viewing
- [ ] Verify data sync
  - Check all 10 employees' data
  - Verify activity logs
  - Confirm screenshots
  - Test daily summaries

### 2. Resource Usage
- [ ] Monitor API calls
  - Check current usage
  - Verify < 50,000 calls/month
  - Review `api_monitor.log`
- [ ] Check storage
  - Verify < 500MB total
  - Monitor screenshot bucket
  - Check cleanup jobs

### 3. Performance
- [ ] Test sync speed
  - Verify < 30 seconds
  - Check batch processing
  - Monitor error rates
- [ ] Check reliability
  - Verify 99% sync success
  - Confirm < 1% error rate
  - Test error handling

### 4. Final Handover
- [ ] Review documentation
  - Check all guides
  - Verify support contacts
  - Update known issues
- [ ] Confirm monitoring
  - Test alerts
  - Verify logging
  - Check backups
- [ ] Create system backup
  - Export Supabase schema:
    ```sql
    -- In Supabase SQL Editor
    SELECT * FROM pg_dump;
    ```
  - Export database data:
    - Go to Database > Backups
    - Click "Create Backup"
    - Download backup file
  - Store backup securely:
    - Save to secure location
    - Document backup location
    - Share with admin team

## Tools Required

### Supabase
- Project URL: https://app.supabase.com
- SQL Editor: For migrations
- Storage: For screenshots
- Authentication: For users
- Database: For activity data

### Vercel
- Project URL: https://vercel.com
- Environment: For variables
- Deployments: For frontend
- Analytics: For monitoring

### GitHub
- Repository: For code
- Actions: For CI/CD
- Issues: For tracking

## Roles

### Admin
- Project creation
- User management
- Policy configuration
- Monitoring setup

### Developer
- Code deployment
- Environment setup
- Testing
- Documentation

### Support
- User training
- Issue tracking
- Monitoring
- Documentation

## Success Criteria

### Performance
- API calls < 50,000/month
- Storage < 500MB
- Sync time < 30 seconds

### Reliability
- 99% sync success
- < 1% error rate
- No data loss

### Usability
- Clear dashboard
- Accurate tracking
- Reliable screenshots 