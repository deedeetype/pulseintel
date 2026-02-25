# 🔖 PulseIntel Restore Points

## v2.0-automated-scans-working (2026-02-25 16:59 EST) ⭐ CURRENT

**Commit:** `feea8b9`  
**Tag:** `v2.0-automated-scans-working`

### Status: STABLE - Automated scans fully working!

### What's Working:
- ✅ All features from v1.0-stable
- ✅ **Automated scan scheduling UI** (Settings → Automated Scans tab)
- ✅ **Next.js Scheduled API Route** (`pages/api/cron/refresh-scans.ts`)
- ✅ **Hourly automated refreshes** (0 * * * * cron)
- ✅ **Auto-update last_run_at and next_run_at**
- ✅ **Generates new insights/alerts on each refresh**
- ✅ **refresh_count increments correctly**

### Proven Working:
- Last automated run: 2026-02-25 16:50 EST
- Generated 5 new insights successfully
- Schedule auto-updated for next day

### Database Schema:
```
- scans (id, user_id, industry, refresh_count, last_refreshed_at, ...)
- competitors (id, scan_id, name, domain, threat_score, ...)
- alerts (id, scan_id, title, priority, read, ...)
- insights (id, scan_id, type, title, confidence, ...)
- news_feed (id, scan_id, title, summary, source_url, ...)
- scan_schedules (id, scan_id, frequency, hour, next_run_at, last_run_at, ...)
- refresh_logs (created, ready for implementation)
```

### Architecture:
- **Scheduled Jobs:** Next.js Scheduled API Routes (NOT netlify/functions!)
  - Path: `pages/api/cron/refresh-scans.ts`
  - Config: `type: 'experimental-scheduled'`
  - Works with @netlify/plugin-nextjs
- **Functions:** scan-step.mts for scan orchestration
- **Frontend:** React Context (AlertsContext, NewsFeedContext)

### Known Issues:
- RLS policies temporarily permissive (`USING (true)`) - needs proper user table
- Activity/refresh logging created but not yet implemented
- No email notifications yet

### Key Learnings:
- ❌ Netlify Functions with `schedule` export DON'T work with Next.js
- ✅ Next.js Scheduled API Routes with `experimental-scheduled` DO work
- Must use `pages/api/` not `netlify/functions/` for scheduled jobs

### Restore Command:
```bash
cd /data/.openclaw/workspace/business/pulseintel
git checkout v2.0-automated-scans-working
npm install
```

### Next Features:
→ Activity/refresh logs UI (badge + history page)
→ Email notifications on new alerts
→ Export PDF reports
→ Stripe monetization

---

## v1.0-stable (2026-02-25 12:02 EST) ✅

**Commit:** `1da0c49`  
**Tag:** `v1.0-stable`

### Status: STABLE - All features working

### What's Working:
- ✅ User authentication (Clerk)
- ✅ Manual industry scans (competitors, news, alerts, insights)
- ✅ Profile management (create, refresh, delete)
- ✅ Real-time dashboard with KPIs
- ✅ Alerts view with unread badges + context state
- ✅ News feed view with context state
- ✅ Competitors view
- ✅ Insights view
- ✅ Industry analytics
- ✅ Settings (language, scan preferences)
- ✅ Demo page with parallax scroll animations
- ✅ Landing page with hero + features
- ✅ Scan modal with animated progress bar + working cancel
- ✅ Context-based state management (AlertsContext, NewsFeedContext)
- ✅ Supabase RLS security (all data isolation working)
- ✅ Netlify Functions (scan-step with markdown fence JSON parsing)

### Database Schema:
```
- scans (id, user_id, industry, company_url, status, created_at, ...)
- competitors (id, scan_id, name, domain, threat_score, ...)
- alerts (id, scan_id, title, priority, read, ...)
- insights (id, scan_id, type, title, confidence, ...)
- news_feed (id, scan_id, title, summary, source_url, ...)
```

### Known Issues:
- None critical

### Restore Command:
```bash
cd /data/.openclaw/workspace/business/pulseintel
git checkout v1.0-stable
npm install
```

### Next Feature:
→ Automated periodic scans with user-configurable schedules

---

## How to Create a Restore Point:

```bash
# 1. Commit all changes
git add -A
git commit -m "Description of current state"

# 2. Create annotated tag
git tag -a v2.X-feature-name -m "Description of version"

# 3. Push tag
git push origin v2.X-feature-name

# 4. Update this file
```

## How to Restore:

```bash
# List all tags
git tag -l

# Checkout specific version
git checkout v2.0-automated-scans-working

# Or restore to tag but keep working
git reset --hard v2.0-automated-scans-working

# Resume development
git checkout main
```
