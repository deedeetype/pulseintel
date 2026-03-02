#!/bin/bash

# ========================================
# Test Manual Refresh via API
# Date: 2026-03-02
# ========================================

# Vérifier que CRON_SECRET est défini
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not set. Please set it first:"
  echo "export CRON_SECRET='your_secret_here'"
  exit 1
fi

echo "🚀 Triggering manual refresh..."
echo ""

# Appeler l'API de refresh
curl -X POST "https://pulseintel.netlify.app/api/cron/refresh-scans" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -v

echo ""
echo ""
echo "✅ Refresh triggered!"
echo "📊 Check Activity Log at: https://pulseintel.netlify.app/dashboard (Activity tab)"
echo ""
echo "Note: The refresh runs in background, so it may take 20-30 seconds to complete."
