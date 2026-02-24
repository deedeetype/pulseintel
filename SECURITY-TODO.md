# 🔒 SECURITY TODO - Before Production

## ⚠️ CRITICAL: RLS Policies are PUBLIC (Demo Mode Only)

**Current State:**
All tables (scans, competitors, alerts, insights, news_feed) have **PUBLIC DELETE policies** that allow anyone to delete any data.

```sql
-- Current (UNSAFE for production):
CREATE POLICY "Public delete scans" ON scans FOR DELETE USING (true);
```

**Before going public, you MUST:**

### 1. Implement Clerk Authentication
- [ ] Install `@clerk/nextjs`
- [ ] Configure Clerk provider in `app/layout.tsx`
- [ ] Add sign-in/sign-up pages
- [ ] Protect dashboard route with `auth()`

### 2. Connect Clerk to Supabase
- [ ] Create Clerk webhook to sync users to Supabase
- [ ] Add Clerk user ID to Supabase JWT claims
- [ ] Update `supabase.ts` to use Clerk session token

### 3. Restrict RLS Policies
Replace all public policies with user-scoped ones:

```sql
-- Delete public policies
DROP POLICY "Public delete scans" ON scans;
DROP POLICY "Public delete competitors" ON competitors;
DROP POLICY "Public delete alerts" ON alerts;
DROP POLICY "Public delete insights" ON insights;
DROP POLICY "Public delete news_feed" ON news_feed;

-- Add user-scoped policies
CREATE POLICY "Users can delete own scans" ON scans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Competitors/alerts/insights/news will cascade delete automatically
-- But if you want explicit policies:
CREATE POLICY "Users can delete own competitors" ON competitors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = competitors.scan_id 
      AND scans.user_id = auth.uid()
    )
  );

-- Same pattern for alerts, insights, news_feed
```

### 4. Update SELECT/INSERT/UPDATE Policies
Currently only READ is restricted. Add:

```sql
-- Only insert your own scans
CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only update your own scans
CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only read your own scans
DROP POLICY "Public read scans" ON scans;
CREATE POLICY "Users can read own scans" ON scans
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 5. Remove DEMO_USER_ID
- [ ] Remove hardcoded `DEMO_USER_ID` from Netlify env vars
- [ ] Update `scan-step.mts` to use authenticated user ID
- [ ] Pass user ID from frontend via JWT

## Timeline
- **Current:** Demo mode (single user, you)
- **Before sharing URL:** Implement steps 1-5
- **Before launch:** Security audit + penetration testing

## Testing Checklist
- [ ] User A cannot see User B's scans
- [ ] User A cannot delete User B's scans
- [ ] Unauthenticated users cannot access dashboard
- [ ] RLS policies block unauthorized access at DB level (not just UI)

---

**Created:** 2026-02-24  
**Tag:** v0.9.0-pre-auth (safe rollback point)
