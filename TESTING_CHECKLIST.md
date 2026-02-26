# 🧪 Testing Checklist - After v2.1 Split Steps

**Date:** 2026-02-26  
**Status:** Post-deployment validation needed

## ✅ Core Features (Should Still Work)

### Authentication & User Management
- [ ] Login with Clerk
- [ ] Signup flow
- [ ] User profile displays correctly
- [ ] Logout works

### Scan Creation (NEW - Split Steps)
- [x] Create new scan (Financial Services tested)
- [ ] Scan completes without timeout
- [ ] All 4 sub-steps execute (competitors → insights → alerts → finalize)
- [ ] Progress bar shows detailed steps (60% → 65% → 75% → 85% → 95%)
- [ ] Scan data appears in dashboard after completion

### Dashboard Views
- [ ] My Watch (Profiles) - lists all user's scans
- [ ] Alerts view - shows alerts with unread count
- [ ] News Feed - shows news articles
- [ ] Competitors view - lists competitors with threat scores
- [ ] Insights view - displays strategic insights
- [ ] Industry Analytics - **CHECK THIS** - should show ALL KPIs restored

### Profile Refresh (Incremental Scans)
- [ ] Click refresh on existing profile
- [ ] Refresh completes successfully
- [ ] Only NEW news/alerts/insights added (no duplicates)
- [ ] refresh_count increments
- [ ] last_refreshed_at updates

### Settings
- [x] Profile tab - editable
- [ ] Scan Preferences tab - regions/watchlist work
- [ ] Notifications tab (if implemented)
- [x] **Automated Scans tab - profiles list correctly** ✅ FIXED

### Automated Scans Feature
- [x] Profiles appear in list
- [ ] Can enable/disable schedule per profile
- [ ] Can set frequency (daily/weekly/monthly)
- [ ] Can set hour and timezone
- [ ] Schedule saves to database
- [ ] next_run_at calculates correctly
- [ ] Cron-job.org webhook triggers refreshes (check logs)

## 🔍 Regression Checks (Things We Changed)

### Multi-User Isolation
- [ ] User A sees ONLY their scans (not User B's)
- [ ] User A sees ONLY their alerts
- [ ] User A sees ONLY their insights/news/competitors
- [ ] RLS policies working correctly

### API Routes
- [x] `/api/scans/list?userId=XXX` works
- [ ] `/api/cron/refresh-scans` still works (called by cron-job.org)
- [ ] All existing API routes still functional

### Netlify Functions
- [ ] `scan-step` function handles all new steps:
  - [ ] `init`
  - [ ] `competitors`
  - [ ] `news`
  - [ ] `analyze-competitors` (NEW)
  - [ ] `analyze-insights` (NEW)
  - [ ] `analyze-alerts` (NEW)
  - [ ] `finalize` (NEW)
  - [ ] `analyze` (deprecated but kept for backward compat)

### Database
- [ ] No orphaned data (failed scans cleaned up)
- [ ] scan_schedules table working
- [ ] refresh_logs table (if used)
- [ ] All foreign keys intact

## ⚠️ Known Issues to Monitor

1. **Industry Analytics KPIs** - Restored in backend, need to verify frontend displays all fields
2. **Scan Success Rate** - Monitor over 24h, should be >90% now (was 54%)
3. **Timeout Issues** - Should be eliminated with 4-step split
4. **Automated Refresh** - Need to verify cron-job.org still triggers correctly

## 🎯 Test Scenarios

### Scenario 1: New User Onboarding
1. [ ] New user signs up
2. [ ] Creates first scan
3. [ ] Scan completes successfully
4. [ ] Dashboard shows data
5. [ ] Can navigate all views

### Scenario 2: Existing User Refresh
1. [ ] User with existing scans logs in
2. [ ] Clicks refresh on a profile
3. [ ] Only new data added
4. [ ] No duplicates
5. [ ] Counts update correctly

### Scenario 3: Automated Scan Setup
1. [ ] User goes to Settings → Automated Scans
2. [ ] Sees all their profiles
3. [ ] Enables daily refresh at specific hour
4. [ ] Schedule saves
5. [ ] Cron job triggers at correct time
6. [ ] Profile refreshes successfully

### Scenario 4: Multi-User Isolation
1. [ ] User A logs in, creates scan
2. [ ] User B logs in, should NOT see User A's scan
3. [ ] Both users can create/view only their own data

## 📊 Metrics to Track

- **Scan Success Rate:** Target >90% (was 54%)
- **Average Scan Duration:** ~45-60 seconds expected
- **Timeout Errors:** Should be 0
- **API 500 Errors:** Should be 0
- **RLS Violations:** Should be 0 (check Supabase logs)

## 🚨 Red Flags to Watch For

- ❌ Scans timing out (means split didn't work)
- ❌ Users seeing other users' data (RLS broken)
- ❌ Missing KPIs in Industry Analytics (prompt not working)
- ❌ Duplicate news/alerts on refresh (deduplication broken)
- ❌ Automated scans not triggering (cron webhook broken)

---

**Instructions:**
1. Run through checklist systematically
2. Mark [x] for tested & working
3. Add notes for any issues found
4. Update ANOMALIES.md with new bugs
5. Create issues in this file for tracking

**David: Peux-tu tester quelques items critiques quand tu as le temps?**
Priorité:
1. ✅ Automated Scans profiles (DONE)
2. Industry Analytics - tous les KPIs visibles?
3. Créer un nouveau scan - complète sans erreur?
4. Refresh un profil existant - ajoute seulement nouvelles données?
