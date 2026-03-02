-- Vérifier l'état actuel avant cleanup
SELECT 
  'scans' as table_name, COUNT(*) as count FROM scans
UNION ALL
SELECT 'competitors', COUNT(*) FROM competitors
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'insights', COUNT(*) FROM insights
UNION ALL
SELECT 'archived_news', COUNT(*) FROM archived_news
UNION ALL
SELECT 'archived_alerts', COUNT(*) FROM archived_alerts
UNION ALL
SELECT 'archived_insights', COUNT(*) FROM archived_insights
UNION ALL
SELECT 'refresh_logs', COUNT(*) FROM refresh_logs
ORDER BY table_name;
