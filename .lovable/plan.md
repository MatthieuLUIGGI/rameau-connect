## Objectif

Réduire la durée de session à 15 minutes et déconnecter automatiquement l'utilisateur à la fermeture de l'onglet ou du navigateur.

## Changements

### 1. Durée de session : 1h → 15 min
Dans `src/contexts/AuthContext.tsx` :
- `SESSION_MAX_AGE_MS = 15 * 60 * 1000`
- Réduire l'intervalle de vérification périodique de 60s à 30s pour une déconnexion plus réactive après expiration.

### 2. Déconnexion à la fermeture de l'onglet/navigateur
Passer le stockage de la session Supabase de `localStorage` (persistant) à `sessionStorage` (effacé à la fermeture de l'onglet).

Modification dans `src/integrations/supabase/client.ts` :
```ts
auth: {
  storage: sessionStorage,
  persistSession: true,
  autoRefreshToken: true,
}
```

Et stocker `login_time` dans `sessionStorage` au lieu de `localStorage` dans `AuthContext.tsx` (signIn / checkSessionExpiry / signOut).

## Comportement résultant

| Cas | Comportement |
|---|---|
| Inactivité > 15 min onglet ouvert | Déconnecté (vérif toutes les 30s) |
| Onglet fermé puis rouvert | **Déconnecté** (sessionStorage vidé) |
| Navigateur fermé puis rouvert | **Déconnecté** |
| Redémarrage PC | Déconnecté |
| Plusieurs onglets | Chaque onglet a sa propre session ; fermeture d'un onglet = déco de cet onglet uniquement |

## Note technique importante

`src/integrations/supabase/client.ts` est marqué auto-généré dans les consignes du projet. Il faut vérifier s'il est réellement éditable ; sinon, alternative : configurer le storage via une surcharge dans `AuthContext.tsx` n'est pas possible (il faut le passer à `createClient`).

Si le fichier ne peut pas être modifié, fallback : ajouter dans `AuthContext.tsx` un listener `beforeunload` / `visibilitychange` qui appelle `supabase.auth.signOut()` à la fermeture — moins fiable mais fonctionnel.

## Multi-onglets

Avec `sessionStorage`, chaque onglet est isolé : se connecter dans un onglet ne connecte pas les autres. Confirmez si cela vous convient, ou si vous préférez garder une session partagée entre onglets (auquel cas on garde `localStorage` + on ajoute un flag de fermeture navigateur, moins fiable).
