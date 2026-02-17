# Environment Variables Debug Guide

## Problem: "supabaseUrl is required"

This means Netlify Functions cannot access `process.env.SUPABASE_URL`.

## ✅ Solution: Add Environment Variables to Netlify

### **Step 1: Go to Netlify Dashboard**

1. Visit: https://app.netlify.com
2. Select your site: **pulseintel**
3. Go to: **Site Settings** → **Environment Variables**

### **Step 2: Add These Variables**

Click "Add a variable" and add each one:

```
Name: SUPABASE_URL
Value: https://erkzlqgpbrxokyqtrgnf.supabase.co
Scopes: All deploys (Production, Deploy Previews, Branch deploys)
```

```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs
Scopes: All deploys
```

### **Step 3: Trigger Redeploy**

**Option A:** Click "Trigger deploy" → "Deploy site"

**Option B:** Push any change to GitHub (triggers auto-deploy)

```bash
cd business/webapp-generator/generated/pulseintel
git commit --allow-empty -m "Trigger redeploy"
git push
```

### **Step 4: Verify**

Once redeployed, test: https://pulseintel.netlify.app/onboarding-sse

---

## 🔍 How to Check if Variables are Set

In Netlify Dashboard → Site Settings → Environment Variables, you should see:

- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_KEY` ✅

If they're missing or showing "Not set", that's the problem.

---

## 🚨 Common Issues

### **"Variables are set but still not working"**

**Cause:** Netlify caches old builds. Variables only apply to **new** deploys.

**Fix:** Trigger a fresh deploy (see Step 3)

### **"It worked before"**

**Cause:** Previous code might have had fallbacks or was using client-side logic. The new SSE route requires server-side env vars.

**Fix:** Ensure vars are in Netlify (not just local `.env`)

### **"How do I know if it's really working?"**

**Test:** After adding vars and redeploying, check Netlify Function logs:
- Site → Functions → `/api/scan/stream`
- Should show logs without "MISSING" errors

---

## ✅ Checklist

- [ ] SUPABASE_URL added to Netlify env vars
- [ ] SUPABASE_SERVICE_KEY added to Netlify env vars
- [ ] Site redeployed (wait 2-3 min)
- [ ] Test /onboarding-sse page
- [ ] Check Function logs if still failing

---

## 📞 Still Not Working?

Share screenshot of:
1. Netlify → Site Settings → Environment Variables page
2. Netlify → Deploys → Latest deploy log
3. Error message from browser console

I'll help debug! 🦝
