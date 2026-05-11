# Release / rollback v9.00

## Release

1. Commit GitHub avec tag `v9.00`.
2. Déploiement Netlify Preview.
3. Contrôle Safari et Chrome.
4. Export diagnostic v9.00.
5. Export audit local.
6. Test diagnostic Functions non destructif.
7. Validation PDF, import/export JSON, workflow et rôles.

## Rollback

1. Revenir au tag GitHub `v8.90`.
2. Redéployer Netlify depuis le commit v8.90.
3. Ne pas restaurer automatiquement les données locales.
4. Exporter diagnostic et audit avant toute opération destructive.
5. Contrôler la compatibilité minimale v8.10.
