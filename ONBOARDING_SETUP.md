# PulseIntel Onboarding Flow Setup

## ✅ What's Ready

### 1. **Onboarding Page** (`/app/onboarding/page.tsx`)
- Beautiful industry selection UI
- 8 pre-configured industries (Video Games, HealthTech, FinTech, etc.)
- Progress simulation with animated loading states
- Auto-redirects to dashboard after "scan"

### 2. **API Endpoint** (`/app/api/scan/route.ts`)
- `POST /api/scan` - Trigger agent scan
- `GET /api/scan?jobId=xxx` - Check scan status (for polling)
- Ready for background job integration

### 3. **NewsAPI Integration** (Agent)
- Real news data collection (20 items per scan)
- Industry-specific queries
- Relevance scoring and tag extraction
- ✅ Tested and working with your API key

## 🎯 Current Flow

```
1. User visits /onboarding
   ↓
2. Selects industry (Video Games, HealthTech, etc.)
   ↓
3. Clicks "Start AI Scan"
   ↓
4. Animated progress (20-30 seconds)
   ↓
5. Auto-redirects to /dashboard
   ↓
6. Dashboard shows live data from Supabase
```

## 🚧 What's Mock vs Real

### ✅ **Currently Real:**
- NewsAPI news collection (20 real articles)
- Claude AI analysis (threat scores, insights, alerts)
- Supabase data storage
- Dashboard display

### 🎭 **Currently Mock:**
- Competitor discovery (using mock Video Games data)
  - Reason: Brave Search quota exceeded
  - Fix: Upgrade Brave API or use alternative
- Progress simulation (frontend animation only)
  - Reason: Agent runs server-side, not triggered by UI yet
  - Fix: See integration options below

## 🔌 Integration Options

### **Option A: Server-Side Trigger (Recommended)**

When user clicks "Start AI Scan", trigger the agent on the server:

```typescript
// app/api/scan/route.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const { industry } = await request.json()
  
  // Run agent in background
  execAsync(`cd ../../../pulseintel-agent && node agent.js "${industry}"`)
    .catch(err => console.error('Agent error:', err))
  
  return NextResponse.json({ success: true })
}
```

**Pros:**
- Simple, no extra infrastructure
- Works immediately

**Cons:**
- Blocks API response (~20s)
- No real-time progress updates

### **Option B: Background Queue (Production)**

Use a job queue for async processing:

```typescript
// Use BullMQ, Inngest, or similar
import { queue } from '@/lib/queue'

await queue.add('scan-industry', {
  industry,
  userId,
})

// Worker processes job separately
// Updates progress in real-time via webhooks/SSE
```

**Pros:**
- Non-blocking
- Real-time progress
- Scalable

**Cons:**
- Requires Redis/queue infrastructure
- More setup

### **Option C: Cron + Manual Trigger**

User selects industry, agent runs on schedule:

```typescript
// User saves industry preference
await supabase.from('user_settings').update({
  tracked_industry: industry
})

// Cron runs agent every 6 hours
// Next scan: user sees results within 6h
```

**Pros:**
- No blocking
- Scales well
- Continuous monitoring

**Cons:**
- Not immediate
- Less interactive

## 🚀 Quick Setup (Option A - Test Now)

1. **Make onboarding the landing page:**

```bash
cd business/webapp-generator/generated/pulseintel
```

Edit `app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/onboarding')
}
```

2. **Test locally:**

```bash
npm run dev
```

Visit http://localhost:3000
- Select "Video Games"
- Click "Start AI Scan"
- Watch progress animation
- Auto-redirect to dashboard

3. **Deploy to Netlify:**

```bash
git add .
git commit -m "Add onboarding flow"
git push
```

## 📊 Current Agent Performance

Latest run with NewsAPI:
```
Duration: 21.0s
✓ 11 competitors discovered
✓ 5 alerts generated
✓ 4 insights created
✓ 20 news items collected (REAL from NewsAPI!)
```

## 🎨 Customization

### Add More Industries

Edit `app/onboarding/page.tsx`:

```typescript
const INDUSTRIES = [
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿', description: 'Blockchain, DeFi, Web3' },
  // Add more...
]
```

### Change Colors/Branding

Replace purple/blue gradients in:
- `app/onboarding/page.tsx`
- Tailwind config if needed

### Custom Progress Messages

Edit the `steps` array in `handleStartScan()`:

```typescript
const steps = [
  { progress: 20, message: 'Your custom message...' },
  // ...
]
```

## 🔥 Next Steps

1. **Test onboarding flow** locally or on Netlify
2. **Choose integration option** (A/B/C)
3. **Implement agent trigger** from UI
4. **Add user authentication** (Clerk)
5. **Enable multi-user** with RLS

## 📝 Notes

- **NewsAPI Key**: Already configured in agent `.env`
- **Mock Competitors**: Will use real Brave Search when quota resets (or upgrade)
- **Dashboard**: Already shows live Supabase data
- **Real-time Updates**: Supabase subscriptions already working

---

Built with 🦝 by Sully @ Labwyze Inc.
