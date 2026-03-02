#!/bin/bash

# ========================================
# Test Manual Refresh via Direct API Call
# NO SECRET REQUIRED (for testing only)
# Date: 2026-03-02
# ========================================

echo "🚀 Option 1: Via Netlify Dev (Local)"
echo "--------------------------------------"
echo "If you have netlify-cli installed:"
echo "  netlify dev"
echo "Then in another terminal:"
echo "  curl -X POST http://localhost:8888/api/cron/refresh-scans"
echo ""

echo "🚀 Option 2: Create scan_schedule in Supabase"
echo "--------------------------------------"
echo "1. Go to Supabase SQL Editor"
echo "2. Find your latest scan ID:"
echo ""
echo "   SELECT id, industry, user_id FROM scans ORDER BY created_at DESC LIMIT 1;"
echo ""
echo "3. Create a schedule (replace SCAN_ID and USER_ID):"
echo ""
echo "   INSERT INTO scan_schedules ("
echo "     scan_id, user_id, frequency, enabled, next_run_at, timezone"
echo "   ) VALUES ("
echo "     'SCAN_ID_HERE',"
echo "     'USER_ID_HERE',"
echo "     'daily',"
echo "     true,"
echo "     NOW() - INTERVAL '1 minute',  -- In the past = runs immediately"
echo "     'America/New_York'"
echo "   );"
echo ""
echo "4. Wait ~5 minutes for next cron run, or..."
echo ""

echo "🚀 Option 3: Manual curl with production secret"
echo "--------------------------------------"
echo "If you have CRON_SECRET from Netlify env vars:"
echo ""
echo "  curl -X POST 'https://pulseintel.netlify.app/api/cron/refresh-scans' \\"
echo "    -H 'x-cron-secret: YOUR_SECRET_HERE'"
echo ""
echo "Find CRON_SECRET at:"
echo "  https://app.netlify.com/sites/pulseintel/configuration/env"
echo ""
