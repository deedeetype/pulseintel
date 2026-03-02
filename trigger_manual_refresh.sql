-- ========================================
-- Trigger Manual Refresh for Testing
-- Date: 2026-03-02
-- ========================================

-- Option 1: Créer un scan_schedule qui s'exécutera immédiatement
-- (next_run_at dans le passé)

-- D'abord, trouver un scan existant
SELECT id, industry, company_name, user_id 
FROM scans 
WHERE status = 'completed' 
ORDER BY created_at DESC 
LIMIT 5;

-- Ensuite, créer un schedule pour ce scan (remplacer les valeurs ci-dessous)
-- INSERT INTO scan_schedules (
--   scan_id,
--   user_id,
--   frequency,
--   enabled,
--   next_run_at,
--   timezone
-- ) VALUES (
--   'SCAN_ID_ICI',           -- Remplacer par l'ID du scan ci-dessus
--   'USER_ID_ICI',           -- Remplacer par le user_id du scan
--   'daily',
--   true,
--   '2026-03-02T16:30:00Z',  -- Dans le passé = s'exécute immédiatement au prochain cron
--   'America/New_York'
-- );

-- Option 2: Appeler directement l'API de refresh via curl (plus simple)
-- Voir ci-dessous dans le fichier test_refresh.sh
