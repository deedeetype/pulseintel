# Supabase Setup Guide for PulseIntel

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Project name: `pulseintel`
4. Database password: (save this securely!)
5. Region: Choose closest to you
6. Click "Create new project"

## 2. Run Schema

1. In Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy/paste content from `supabase/schema.sql`
4. Click "Run" (or press Ctrl/Cmd + Enter)
5. Wait for "Success" message

This creates:
- 6 tables (users, competitors, alerts, insights, news_feed, market_trends)
- Indexes for performance
- Row Level Security policies
- Triggers for timestamps

## 3. Seed Demo Data

1. Still in SQL Editor, create "New query"
2. Copy/paste content from `supabase/seed.sql`
3. Click "Run"

This inserts:
- 1 demo user
- 5 competitors
- 6 alerts
- 4 AI insights

## 4. Get API Keys

1. In Supabase Dashboard → Settings → API
2. Copy these values:

```
Project URL: https://xxx.supabase.co
anon public key: eyJhb...
service_role key: eyJhb...
```

## 5. Add to Netlify

1. Go to Netlify → Your site → Site settings → Environment variables
2. Add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

3. Redeploy site

## 6. Test Locally

```bash
cd generated/pulseintel

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
EOF

npm install
npm run dev
```

Open http://localhost:3000/dashboard

You should see:
- Real competitor data
- Live alerts
- AI insights
- Working KPIs

## 7. Verify Data

In Supabase Dashboard → Table Editor:

- Check `competitors` table → Should see 5 rows
- Check `alerts` table → Should see 6 rows  
- Check `insights` table → Should see 4 rows

## Troubleshooting

**"relation does not exist"**
→ Schema not run correctly. Re-run `schema.sql`

**"violates foreign key constraint"**
→ Run schema.sql before seed.sql

**"No rows returned"**
→ RLS policies active but no auth yet. Temporarily disable RLS for testing:
```sql
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE insights DISABLE ROW LEVEL SECURITY;
```

**Empty dashboard**
→ Check browser console for errors
→ Verify env vars in Netlify/local
→ Check Supabase API logs in Dashboard

## Next Steps

Once data is flowing:
1. Dashboard will show real metrics
2. Can add/edit competitors via Table Editor
3. Real-time updates work automatically
4. Ready to integrate Clerk auth (RLS will use real user IDs)
