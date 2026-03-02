#!/bin/bash

echo "🦝 Checking GitHub Actions workflow status..."
echo ""

# Check if SUPABASE_SERVICE_KEY secret is set in GitHub
echo "🔐 Required GitHub Secrets:"
echo "  - SUPABASE_SERVICE_KEY (must be set in repo settings)"
echo ""

# Show next scheduled run
echo "⏰ Workflow Schedule:"
echo "  - Runs every hour at :00 (UTC)"
echo "  - Next run: Top of next hour ($(date -u +'%Y-%m-%d %H:00:00 UTC'))"
echo ""

echo "🧪 To test manually:"
echo "  1. Go to: https://github.com/deedeetype/pulseintel/actions"
echo "  2. Select 'Scheduled Scan Refresh' workflow"
echo "  3. Click 'Run workflow' button"
echo ""

echo "📋 To monitor:"
echo "  - GitHub Actions logs: https://github.com/deedeetype/pulseintel/actions"
echo "  - Or run: ./monitor-refresh.sh"
