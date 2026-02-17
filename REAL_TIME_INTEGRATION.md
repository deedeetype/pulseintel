# PulseIntel Real-Time Integration 🚀

## ✅ What's Implemented

### **Two Integration Approaches:**

#### **1. Polling-Based** (`/onboarding`)
- ✅ POST `/api/scan` triggers agent
- ✅ GET `/api/scan?jobId=xxx` checks progress
- ✅ Frontend polls every 1 second
- ✅ Simple, works everywhere

#### **2. Server-Sent Events** (`/onboarding-sse`)
- ✅ GET `/api/scan/stream?industry=xxx` streams updates
- ✅ Real-time progress without polling
- ✅ More efficient, better UX
- ✅ Modern browser support

## 🏗️ Architecture

```
User clicks "Start AI Scan"
  ↓
Frontend calls API
  ↓
Backend triggers agent script
  ↓
Agent runs: node agent.js "Video Games"
  ↓
Progress tracked in memory store
  ↓
Frontend receives updates (polling or SSE)
  ↓
Real-time progress bar updates
  ↓
Agent completes → Parse results
  ↓
Redirect to dashboard with real data
```

## 📂 Files Created

```
src/
├── lib/
│   └── agent-runner.ts          # Agent orchestration & progress tracking
├── app/
    ├── api/
    │   └── scan/
    │       ├── route.ts          # POST (trigger) & GET (poll)
    │       └── stream/
    │           └── route.ts      # SSE real-time stream
    ├── onboarding/
    │   └── page.tsx              # Polling-based (updated)
    └── onboarding-sse/
        └── page.tsx              # SSE-based (NEW)
```

## 🎯 How It Works

### **agent-runner.ts** (Core Logic)

```typescript
// Start scan (non-blocking)
const jobId = await startAgentScan(industry, userId)

// Internally:
// 1. Generate unique job ID
// 2. Store initial progress in memory
// 3. Run agent asynchronously
// 4. Update progress as agent runs
// 5. Parse agent output for results
// 6. Mark as complete

// Check progress
const progress = getScanProgress(jobId)
// Returns: { progress: 75, message: "Generating insights...", status: "running" }
```

### **Progress Phases**

```typescript
0%   → Initializing AI agent...
10%  → (internal setup)
25%  → Searching for {industry} companies...
40%  → Collecting recent news...
60%  → Analyzing competitors with AI...
75%  → Generating strategic insights...
90%  → Creating alerts and reports...
100% → Dashboard ready! ✅
```

### **Agent Output Parsing**

The runner parses agent stdout:

```
🎯 15 competitors discovered
🔔 5 alerts generated
💡 4 insights created
📰 20 news items collected

→ Extracted as:
{
  competitors: 15,
  alerts: 5,
  insights: 4,
  news: 20
}
```

## 🚀 Testing

### **Option 1: Polling Version**

Visit: https://pulseintel.netlify.app/onboarding

1. Select "Video Games"
2. Click "Start AI Scan"
3. Watch real-time progress
4. Agent runs on server
5. Auto-redirect to dashboard

### **Option 2: SSE Version (Recommended)**

Visit: https://pulseintel.netlify.app/onboarding-sse

Same flow, but with Server-Sent Events for more efficient real-time updates.

### **Local Testing**

```bash
cd business/webapp-generator/generated/pulseintel
npm run dev
```

Visit:
- http://localhost:3000/onboarding (polling)
- http://localhost:3000/onboarding-sse (SSE)

## 🔧 Configuration

### **Agent Path**

Set in `agent-runner.ts`:

```typescript
const agentPath = '/data/.openclaw/workspace/business/pulseintel-agent'
```

Update if agent is deployed elsewhere.

### **Memory Store**

Current: In-memory Map (resets on server restart)

**Production options:**
- Redis (recommended)
- PostgreSQL
- Supabase (real-time subscriptions)

Example with Redis:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({ /* ... */ })

async function updateProgress(jobId: string, progress: any) {
  await redis.set(`scan:${jobId}`, JSON.stringify(progress), { ex: 300 })
}

async function getScanProgress(jobId: string) {
  const data = await redis.get(`scan:${jobId}`)
  return data ? JSON.parse(data) : null
}
```

## 📊 Progress Store Format

```typescript
interface ScanProgress {
  progress: number          // 0-100
  message: string           // "Analyzing competitors..."
  status: 'running' | 'completed' | 'failed'
  results?: {
    competitors: number
    alerts: number
    insights: number
    news: number
  }
}
```

Stored with key: `scan_{timestamp}_{random}`

Auto-deleted after 5 minutes.

## 🎨 Frontend Integration

### **Polling (Simple)**

```typescript
const response = await fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({ industry: 'Video Games' })
})
const { jobId } = await response.json()

// Poll for updates
setInterval(async () => {
  const progress = await fetch(`/api/scan?jobId=${jobId}`)
  const data = await progress.json()
  
  setScanProgress(data.progress)
  setCurrentStep(data.message)
  
  if (data.status === 'completed') {
    router.push('/dashboard')
  }
}, 1000)
```

### **SSE (Efficient)**

```typescript
const eventSource = new EventSource(
  `/api/scan/stream?industry=Video%20Games`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'progress') {
    setScanProgress(data.progress)
    setCurrentStep(data.message)
  } else if (data.type === 'completed') {
    router.push('/dashboard')
  }
}
```

## 🐛 Debugging

### **Check Agent Logs**

```bash
cd business/pulseintel-agent
node agent.js "Video Games"
```

Should output:
```
🦝 PulseIntel AI Agent Starting...
============================================================
...
✨ Agent Run Complete!
Duration: 21.0s
Results:
  🎯 15 competitors discovered
  🔔 5 alerts generated
  💡 4 insights created
  📰 20 news items collected
```

### **Check API Logs**

In Netlify Functions logs, you should see:

```
[API] Scan requested for industry: Video Games, user: demo
[Agent] stdout: ...
```

### **Common Issues**

**"Job not found"**
→ Memory store cleared (server restart)
→ Use Redis for persistence

**"Agent timeout"**
→ Increase timeout in `agent-runner.ts`
→ Check agent path is correct

**"No progress updates"**
→ Check polling interval (should be 1000ms)
→ Check SSE connection in Network tab

## 🚀 Deployment

### **Netlify Functions**

Netlify automatically detects `/api/*` routes as serverless functions.

**Limitations:**
- 10 second timeout (free tier)
- 26 second timeout (pro tier)

**Solution:**
Since agent takes ~20s, this works on Pro tier.

**Alternative:** Use Netlify Background Functions:

```typescript
// netlify/functions/scan-background.ts
export default async (req: Request) => {
  // Runs in background (up to 15 min)
  await runAgentAsync(industry)
}
```

### **Environment Variables**

Add to Netlify:

```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
NEWS_API_KEY=...
POE_API_KEY=...
BRAVE_API_KEY=...
```

## 📈 Performance

**Current:**
- Agent runtime: ~20-30s
- Memory usage: ~50MB
- Progress updates: Every 1s
- Auto-cleanup: 5min after completion

**Optimizations:**
- Cache competitor data (30min TTL)
- Batch Supabase writes
- Use Redis for distributed systems
- Queue system for high volume

## 🎯 Next Steps

1. ✅ **Test both versions** (polling + SSE)
2. ✅ **Deploy to Netlify** (already done)
3. 🔄 **Choose preferred version** (SSE recommended)
4. 🔄 **Add Redis** (optional, for production)
5. 🔄 **Add authentication** (Clerk)
6. 🔄 **Multi-user support** (RLS + user IDs)

---

Built with 🦝 by Sully @ Labwyze Inc.

**Live Demos:**
- Polling: https://pulseintel.netlify.app/onboarding
- SSE: https://pulseintel.netlify.app/onboarding-sse
