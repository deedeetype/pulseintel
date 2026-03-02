# Migration: Add industry to refresh_logs

## Objectif
Préserver l'industrie dans les logs même si le scan est supprimé (éviter "Unknown Industry")

## Changements

### 1. Base de données (Supabase)
**Fichier:** `add_industry_to_refresh_logs.sql`
**Action:** Ajouter colonne `industry TEXT` (nullable, non-breaking)

**Risque:** ✅ AUCUN - La colonne est nullable, ne casse rien

**Exécution:**
1. Aller sur https://supabase.com/dashboard/project/erkzlqgpbrxokyqtrgnf/editor
2. Copier/coller le contenu de `add_industry_to_refresh_logs.sql`
3. Cliquer "Run"

### 2. Backend (Cron automated refresh)
**Fichier:** `pages/api/cron/refresh-scans.ts` (ligne ~302)
**Changement:** Ajouter `industry: scan.industry` lors de l'insertion du log

**Statut:** ✅ FAIT

### 3. Frontend (ActivityView)
**Fichier:** `src/components/ActivityView.tsx`
**Changements:**
- Interface `RefreshLog` avec `industry?: string`
- Display logic: `log.industry` → `log.scan?.industry` → "Deleted Profile"

**Statut:** ✅ FAIT

## Déploiement

1. **Exécuter migration SQL** (Supabase Dashboard)
2. **Commit + push code changes**
3. **Deploy Netlify** (auto via GitHub)

## Test

1. Lancer un scan automatisé (attendre le cron OU déclencher manuellement via API)
2. Vérifier dans Activity Log que l'industrie s'affiche
3. Supprimer le scan
4. Vérifier que l'Activity Log affiche toujours l'industrie (ou "Deleted Profile" si scan supprimé avant la migration)

## Rollback (si problème)

```sql
ALTER TABLE refresh_logs DROP COLUMN IF EXISTS industry;
```

