# Plan : Journal d'activité complet

## Objectif

Loguer **les 8 actions** (`page_view`, `login`, `logout`, `create`, `update`, `delete`, `export`, `password_change`) sur l'ensemble du site, et purger automatiquement les logs > 1 an.

Le timer de session 1h fixe après login est conservé tel quel.

## 1. Tracking automatique des visites de pages

Créer un hook `usePageViewLogger` monté dans `App.tsx` qui écoute `useLocation()` et appelle `logAudit({ action: 'page_view', page: pathname })` à chaque changement de route.

Règles :
- Ne pas loguer si l'utilisateur n'est pas connecté
- Ignorer `/auth`, `/reset-password`, `/cookies`, `/mentions-legales`, `/confidentialite` (bruit inutile)
- Debounce 500 ms pour éviter doublons en cas de double navigation

## 2. Instrumentation des mutations admin

Ajouter `logAudit({ action, entityType, entityId, details: { title } })` dans chaque fichier après chaque opération réussie :

| Fichier | Actions à loguer | entity_type |
|---|---|---|
| `AdminActualites.tsx` | create / update / delete | `actualite` |
| `AdminSondages.tsx` | create / update / delete | `sondage` |
| `Sondages.tsx` | create (vote enregistré) | `vote` |
| `AdminAG.tsx` | create / update / delete | `compte_rendu_ag` |
| `AdminConseilSyndical.tsx` | create / update / delete | `compte_rendu_conseil` |
| `AdminSyndic.tsx` | create / update / delete | `membre` (membres assemblée) |
| `AdminBadgesVigik.tsx` | update | `badge_vigik` |
| `AdminVitrine.tsx` | update (déjà fait — vérifier) | `vitrine` |
| `BoardMembers.tsx` | role toggle (create/delete user_role), reset password | `user_role`, `profile` |
| `BoardOverview.tsx` | approbation/rejet demandes de rôle | `role_request` |
| `BoardPassword.tsx` | changement mot de passe Conseil & Board | `password_change` |
| `Profile.tsx` | update profil, password_change | `profile` |

Pour chaque log : passer `details: { title }` ou `{ name }` quand pertinent pour que la colonne "Détails" affiche un texte parlant dans le journal.

## 3. Auto-purge logs > 1 an

Migration SQL :
- Activer `pg_cron` si pas déjà actif
- Créer une fonction `purge_old_audit_logs()` qui fait `DELETE FROM audit_logs WHERE created_at < now() - interval '1 year'`
- Planifier un cron quotidien à 03:00

## 4. Vérification

- Effectuer une action de chaque type connecté en tant qu'AG
- Vérifier dans `/admin/board` → Journal d'activité que chaque ligne apparaît avec le bon badge, le bon utilisateur et le bon détail
- Filtrer par chaque type d'action pour confirmer

## Détails techniques

- `usePageViewLogger` utilisera `useAuth()` pour obtenir `user` et ne logger que si présent
- Pour les actions `create`, récupérer l'`id` retourné par Supabase via `.select().single()` et le passer en `entityId`
- Pour les `delete`, capturer `id` + `title` avant la suppression
- Le hook `useNotifications` n'est PAS instrumenté (lectures seulement)
- Les RLS existantes permettent déjà l'INSERT par tout utilisateur authentifié (`auth.uid() = user_id`), aucun changement nécessaire

## Hors scope

- Comportement de session (gardé en 1h fixe après login comme demandé)
- UI du journal (déjà complète : filtres, pagination, badges)
