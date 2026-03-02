-- Supprimer les logs qui pointent vers des scans inexistants
DELETE FROM refresh_logs
WHERE scan_id NOT IN (SELECT id FROM scans);

-- Vérifier ce qui reste
SELECT COUNT(*) as remaining_logs FROM refresh_logs;
