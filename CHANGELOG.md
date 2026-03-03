# Changelog - WyzeLens

All notable changes to this project will be documented in this file.

---

## [v1.0.0-stripe-stable] - 2026-03-03

### 🎉 Major Release: Stripe Integration + Domain Migration

**This is a stable restore point with working Stripe payments.**

### Added
- **Stripe Integration:**
  - Complete payment flow (checkout → webhook → sync)
  - 5 pricing plans: Free, Starter ($15), Pro ($49), Business ($99), Enterprise ($299)
  - Stripe Checkout for subscriptions
  - Webhook handler for subscription events
  - Customer Portal route (manage subscription)
  - Test mode configured and working

- **Database:**
  - `user_subscriptions` table (mirrors Stripe data)
  - `usage_tracking` table (track scans/refreshes)
  - RLS policies for secure access

- **UI Components:**
  - `/pricing` page with 5 beautiful plan cards
  - `PlanBadge` component (shows current plan in sidebar)
  - `UpgradeModal` component (2-plan preview with CTA)
  - Plan-specific colors and icons

- **Clerk Middleware:**
  - Proper middleware setup for API route authentication
  - userId injection via headers for Stripe routes
  - Protected routes: dashboard, onboarding, stripe APIs

### Changed
- **Domain:** Migrated from `pulseintel.netlify.app` to `wyzelens.com`
- **Branding:** Updated to WyzeLens throughout the app
- **Clerk:** Updated allowed domains and redirect URLs
- **Supabase:** Updated Site URL and redirect URLs

### Fixed
- Clerk authentication in Stripe API routes (middleware required)
- Netlify cache issues causing old code to deploy
- Stripe API version compatibility (2023-10-16)
- Build errors related to async onClick handlers

### Removed
- Plan limit enforcement (temporarily removed due to build issues)
  - Will be re-implemented server-side only in next version

### Technical Details
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, Clerk, Supabase, Stripe
- **Deployment:** Netlify with auto-deploy from GitHub
- **Database:** Supabase (erkzlqgpbrxokyqtrgnf)
- **Payment:** Stripe Test Mode
- **Domain:** wyzelens.com (managed by Netlify)

### Testing
- ✅ Stripe checkout flow works
- ✅ Webhook receives events successfully
- ✅ Subscription syncs to database
- ✅ Plan badge displays correctly
- ✅ Dashboard loads without errors
- ⚠️ Plan limits NOT enforced (manual testing required)

### Known Issues
- Users can create unlimited profiles (limit enforcement disabled)
- 406 errors in console for Free users (expected, can be ignored)
- Need to add server-side limit checks in next version

### Migration Notes
If upgrading from v0.9.6:
1. Run SQL migration: `migrations/add_subscriptions.sql`
2. Add Stripe env vars to Netlify (8 variables)
3. Configure webhook in Stripe Dashboard
4. Create 4 products in Stripe with pricing
5. Update Clerk allowed domains
6. Update Supabase redirect URLs

---

## [v0.9.6-stable] - 2026-03-02

### Activity Log + Auto-refresh + Resilience

- Industry display in Activity Log
- Auto-retry for 502/503/504 errors (3x exponential backoff)
- Critical Alerts KPI accuracy
- Alert priority sorting

---

## [v0.9.5-stable] - 2026-02-28

### Archive System + Refresh Fixes

- Complete archive system for News/Alerts/Insights
- Refresh updates existing scan (no duplicates)
- Date grouping for news
- Smart duplicate detection

---

_For detailed commit history, see git log._
