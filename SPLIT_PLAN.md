# Plan: Split stepAnalyzeAndWrite en 4 steps

## Objectif
Réduire timeout en splitant l'analyse en steps < 10s chacun

## Architecture actuelle (1 step = 30s timeout)
```
Step 3: analyze
  - Fetch competitors (if first scan)
  - Generate insights (Poe API ~8s)
  - Generate alerts (Poe API ~8s)
  - Analyze competitors (Poe API ~8s si first scan)
  - Fetch stock prices (Perplexity ~5s)
  - Generate analytics (Perplexity ~8s)
  - Write ALL data to DB (~3s)
Total: ~30s → TIMEOUT!
```

## Nouvelle architecture (4 steps courts)
```
Step 3a: analyze-competitors (if first scan)
  - Poe API: competitor analysis
  - Perplexity: stock prices (optional, skip si timeout)
  - Return: analyzed competitors JSON
  Duration: ~8s ✅

Step 3b: analyze-insights  
  - Poe API: generate insights
  - Return: insights JSON
  Duration: ~8s ✅

Step 3c: analyze-alerts
  - Poe API: generate alerts  
  - Return: alerts JSON
  Duration: ~8s ✅

Step 3d: finalize
  - Perplexity: industry analytics (only if new scan)
  - Write ALL data to DB
  - Update scan status = completed
  Duration: ~8s ✅
```

## Frontend orchestration
```typescript
// After news step...
let competitorsData = []

if (!isRefresh) {
  // Step 3a: Analyze competitors (new scan only)
  const compResult = await callStep('analyze-competitors', { 
    industry, scanId, companies, userId 
  })
  competitorsData = compResult.competitors
}

// Step 3b: Generate insights
const insightsResult = await callStep('analyze-insights', { 
  industry, scanId, news, competitorNames, userId 
})

// Step 3c: Generate alerts  
const alertsResult = await callStep('analyze-alerts', { 
  industry, scanId, news, competitorNames, userId 
})

// Step 3d: Finalize (write everything + analytics)
await callStep('finalize', { 
  industry, scanId, 
  competitors: competitorsData, 
  insights: insightsResult.insights,
  alerts: alertsResult.alerts,
  news, 
  isRefresh,
  userId 
})
```

## Backend: 4 nouveaux case statements
```typescript
case 'analyze-competitors':
  result = await stepAnalyzeCompetitors(industry, scanId, companies, userId)
  break
  
case 'analyze-insights':
  result = await stepAnalyzeInsights(industry, scanId, news, competitorNames, userId)
  break
  
case 'analyze-alerts':
  result = await stepAnalyzeAlerts(industry, scanId, news, competitorNames, userId)
  break
  
case 'finalize':
  result = await stepFinalize(industry, scanId, competitors, insights, alerts, news, isRefresh, userId)
  break
```

## Avantages
- ✅ Chaque step < 10s (pas de timeout)
- ✅ Progress visible côté user (4 steps au lieu de 1)
- ✅ Retry possible sur chaque step individuellement
- ✅ Garde l'architecture orchestrée par le frontend
