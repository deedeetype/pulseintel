-- ========================================
-- PulseIntel - Full Database Cleanup
-- Date: 2026-03-02
-- ========================================

-- 1. Supprimer toutes les données (mais garder les tables et policies)
TRUNCATE TABLE refresh_logs CASCADE;
TRUNCATE TABLE archived_insights CASCADE;
TRUNCATE TABLE archived_alerts CASCADE;
TRUNCATE TABLE archived_news CASCADE;
TRUNCATE TABLE insights CASCADE;
TRUNCATE TABLE alerts CASCADE;
TRUNCATE TABLE news CASCADE;
TRUNCATE TABLE competitors CASCADE;
TRUNCATE TABLE scans CASCADE;

-- 2. Réinitialiser les séquences (si applicable)
-- (Les UUIDs n'ont pas besoin de reset)

-- 3. Vérification: Compter les lignes restantes
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

-- 4. Vérifier que les policies RLS sont toujours actives
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
