# 🐛 Known Anomalies - v2.1-stable-split-steps

**Date:** 2026-02-26 16:20 EST  
**Status:** Non-critical, scans working stably  
**User Feedback:** "plusieurs petites anomalies à corriger"

---

## Reported Issues

### 1. Industry Analytics - Missing KPIs
- **Description:** Vue Industry Analytics manquait plusieurs KPIs (market_size_year, projected_size, top_segments, growth_drivers, funding_activity, market_leaders_share, regional_distribution)
- **Severity:** Medium (data incomplet)
- **Impact:** Dashboard - utilisateurs ne voient pas toutes les métriques
- **Root Cause:** Prompt Perplexity simplifié lors du split (v2.1) pour économiser du temps
- **Status:** ✅ FIXED (commit b62612f)
- **Fix:** Restauré le prompt complet de v2.0 avec tous les 12 champs
- **Tested:** En attente de test utilisateur (prochain scan)

### 2. Automated Scans - Profiles not showing in list
- **Description:** Settings → Automated Scans montrait "No profiles yet" malgré que l'utilisateur a créé des scans
- **Severity:** High (feature blocker)
- **Impact:** Settings - utilisateurs ne peuvent pas configurer auto-refresh
- **Root Cause:** RLS policies utilisent JWT claims qui ne sont pas automatiquement passés par Supabase client avec Clerk auth. `current_setting('request.jwt.claims')` fonctionne server-side mais pas client-side.
- **Status:** ✅ FIXED (commit afac49c)
- **Fix:** Créé API route `/api/scans/list` qui utilise `getAuth()` Clerk + service role key pour fetch les scans, bypassing RLS. AutomatedScansSettings appelle maintenant l'API route au lieu de Supabase direct.
- **Tested:** En attente de test utilisateur (refresh page Settings)

### 3. [TO BE DOCUMENTED]
- **Description:** (waiting for user to specify)
- **Severity:** Minor (non-blocking)
- **Impact:** UI/UX
- **Status:** 🔴 Open

---

## Instructions

David, liste les anomalies que tu observes ici ou dis-les moi pour que je les ajoute:

```
1. [Décris l'anomalie]
2. [Décris l'anomalie]
3. ...
```

Je vais les documenter, prioriser, et corriger une par une.

---

## Fixed Issues

_(None yet)_
