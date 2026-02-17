# PulseIntel AI Agent 🤖

Autonomous competitive intelligence agent that discovers competitors, analyzes market signals, and generates strategic insights using AI.

## What it does

1. **Discovers competitors** - Uses Brave Search to find companies in target industry
2. **Collects news** - Gathers recent industry news and announcements
3. **AI Analysis** - Claude analyzes competitors, generates threat scores, insights, and alerts
4. **Populates Dashboard** - Writes everything to Supabase for real-time display

## Setup

### 1. Install Dependencies

```bash
cd business/pulseintel-agent
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Get from Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhb...

# Already configured in workspace
BRAVE_API_KEY=BSAFBNvHqqfiDKa0z_d3Ouoc8BcUtf_

# Your Poe API key
POE_API_KEY=XAsSpPhceBCtgWhzmjVrLcqF-0DZoypUYCnW-oPvdWI

# User ID from Supabase users table
DEMO_USER_ID=<uuid-from-supabase>
```

### 3. Get Demo User ID

In Supabase → Table Editor → `users` table:
- Find the user with `clerk_id = 'demo_user'`
- Copy the `id` (UUID)
- Paste into `.env` as `DEMO_USER_ID`

## Usage

### Run for Video Games industry:

```bash
npm run scan
```

Or specify a different industry:

```bash
node agent.js "Healthcare Technology"
node agent.js "Fintech"
node agent.js "AI/ML Tools"
```

## What happens

```
🦝 PulseIntel AI Agent Starting...
============================================================

📊 PHASE 1: Data Collection

🔍 Searching for competitors in: Video Games
  → Queries Brave Search
  → Extracts company names
  → Found 15 potential competitors

📰 Collecting news for: Video Games
  → Searches recent news
  → Collected 20 news items

============================================================

🧠 PHASE 2: AI Analysis

🤖 Analyzing 15 companies with Claude...
  → Threat scores calculated
  → Activity levels determined
  → Analyzed 15 competitors

💡 Generating strategic insights...
  → Generated 4 insights

🔔 Generating alerts from news...
  → Generated 7 alerts

============================================================

💾 PHASE 3: Database Write

💾 Writing data to Supabase...
  ✓ Inserted 15 competitors
  ✓ Inserted 7 alerts
  ✓ Inserted 4 insights
  ✓ Inserted 20 news items

============================================================

✨ Agent Run Complete!

Industry: Video Games
Duration: 28.3s

Results:
  🎯 15 competitors discovered
  🔔 7 alerts generated
  💡 4 insights created
  📰 20 news items collected

🚀 Dashboard should now show live data!
```

## Architecture

```
agent.js (orchestrator)
  ↓
collectors/
  ├── companies.js    → Brave Search for competitors
  └── news.js         → Brave Search for industry news
  ↓
analyzers/
  └── claude.js       → Poe API (Claude Sonnet 4.5)
                        - Threat scoring
                        - Insights generation
                        - Alert classification
  ↓
writer.js             → Supabase bulk insert
  ↓
Dashboard (real-time update via React hooks)
```

## Testing

After running the agent, check:
1. **Dashboard KPIs** - Should show real numbers
2. **Competitors section** - Top 3 by threat score
3. **Alerts** - Recent alerts with priorities
4. **AI Insights** - Strategic recommendations

## Scheduling (Optional)

Run automatically every 6 hours:

```bash
# Add to crontab
0 */6 * * * cd /path/to/pulseintel-agent && node agent.js "Video Games"
```

Or use OpenClaw cron:

```javascript
{
  "schedule": { "kind": "every", "everyMs": 21600000 }, // 6 hours
  "payload": { 
    "kind": "systemEvent", 
    "text": "Run PulseIntel agent: cd business/pulseintel-agent && node agent.js 'Video Games'"
  }
}
```

## Troubleshooting

**"Missing required environment variables"**
→ Check `.env` file has all 5 variables

**"Error calling Claude"**
→ Verify POE_API_KEY is correct
→ Check Poe API quota

**"Error inserting competitors"**
→ Verify SUPABASE_SERVICE_KEY (not anon key!)
→ Check RLS policies in Supabase

**"No rows returned"**
→ RLS might be blocking. Temporarily disable:
```sql
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
```

**Empty results**
→ Check Brave Search quota (2000/month free tier)

## Next Steps

1. **Run the agent** with Video Games industry
2. **Check dashboard** for live data
3. **Refine prompts** in `analyzers/claude.js` for better insights
4. **Add more collectors** (Twitter, Crunchbase, etc.)
5. **Schedule periodic runs** for continuous monitoring

---

Built with 🦝 by Sully @ Labwyze Inc.
