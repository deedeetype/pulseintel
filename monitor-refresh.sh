#!/bin/bash

SUPABASE_URL="https://erkzlqgpbrxokyqtrgnf.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs"

echo "🦝 PulseIntel Cron Monitor"
echo "=========================="
echo ""

# Check refresh_logs table
echo "📋 Recent refresh logs (last 10):"
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/refresh_logs?order=created_at.desc&limit=10" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | jq -r 'if type == "array" then .[] | "  \(.created_at[0:19]) | \(.status) | Scan: \(.scan_id[0:8]) | User: \(.user_id[0:8]) | \(.triggered_by)" else "No logs found or error" end'

echo ""

# Check for stuck scans
echo "⚠️  Scans stuck in 'running' status:"
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/scans?status=eq.running&select=id,industry,company_name,updated_at" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | jq -r 'if type == "array" and length > 0 then .[] | "  \(.id[0:8]) | \(.industry) | \(.company_name // "N/A") | updated: \(.updated_at[0:19])" else "  ✅ No stuck scans" end'

echo ""

# Check scan_schedules
echo "📅 Active scan schedules:"
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/scan_schedules?enabled=eq.true&select=scan_id,frequency,next_run_at,last_run_at" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | jq -r 'if type == "array" and length > 0 then .[] | "  Scan: \(.scan_id[0:8]) | \(.frequency) | Next: \(.next_run_at[0:19]) | Last: \(.last_run_at[0:19] // "Never")" else "  No active schedules" end'

echo ""
echo "Monitoring active. Press Ctrl+C to stop."
echo "Checking every 2 minutes for new activity..."
echo ""

LAST_LOG_TIME=""

while true; do
  sleep 120
  
  # Get most recent log timestamp
  CURRENT_LOG_TIME=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/refresh_logs?order=created_at.desc&limit=1" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    | jq -r '.[0].created_at // ""')
  
  if [ -n "$CURRENT_LOG_TIME" ] && [ "$CURRENT_LOG_TIME" != "$LAST_LOG_TIME" ]; then
    echo ""
    echo "🔔 NEW REFRESH DETECTED! $(date)"
    echo "================================"
    echo ""
    
    # Show latest logs
    echo "📋 Latest refresh logs:"
    curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/refresh_logs?order=created_at.desc&limit=5" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      | jq -r '.[] | "  \(.created_at[0:19]) | \(.status) | Scan: \(.scan_id[0:8]) | Alerts: \(.new_alerts_count // 0) | Insights: \(.new_insights_count // 0) | News: \(.new_news_count // 0)"'
    
    echo ""
    
    # Check for errors
    FAILED=$(curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/refresh_logs?status=eq.failed&order=created_at.desc&limit=3" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      | jq -r 'if type == "array" and length > 0 then .[] | "  ❌ \(.created_at[0:19]) | Scan: \(.scan_id[0:8]) | Error: \(.error_message // "Unknown")" else "" end' | grep -v "^$")
    
    if [ -n "$FAILED" ]; then
      echo "❌ Failed refreshes:"
      echo "$FAILED"
      echo ""
    fi
    
    LAST_LOG_TIME="$CURRENT_LOG_TIME"
  else
    echo -ne "$(date +"%H:%M:%S") - Waiting for next cron run...\r"
  fi
done
