# Netlify Functions v9.00 — diagnostic contrôlé

## Fonctions préparées

- `diagnostics-ping`
- `auth-login`
- `auth-refresh`
- `users-invite`
- `workflow-submit`
- `workflow-validate`
- `notifications-send`

## Règles

- Les Functions restent désactivées pour l’usage métier réel.
- Aucun secret ne doit être exposé au frontend.
- Le diagnostic peut appeler `diagnostics-ping` avec timeout et fallback.
- Les réponses JSON incluent `ok`, `mode`, `version`, `backendEnabled`, `destructive`, `timestampUTC` et `correlationId`.
- Aucune Function ne doit écrire de données réelles en v9.00.

## Test Netlify preview

1. Déployer la branche sur Netlify Preview.
2. Ouvrir l’application.
3. Aller dans Diagnostic production.
4. Cliquer sur `Diagnostic Functions`.
5. Vérifier que le statut devient `reachable` ou, en contexte local sans Functions, que le fallback offline reste propre.
