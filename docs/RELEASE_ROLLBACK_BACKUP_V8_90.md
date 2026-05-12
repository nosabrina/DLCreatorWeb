# Procédure release / rollback / backup — v8.90

## Branches

- `main` : version stable publiée.
- `develop` : intégration contrôlée avant release.
- `feature/*` : évolution isolée.
- `hotfix/*` : correction urgente depuis `main`.

## Release v8.90

1. Créer une branche `release/v8.90` depuis `develop`.
2. Vérifier `VERSION.md`, `CHANGELOG.md`, `js/config/version.js`, `index.html` et `netlify.toml`.
3. Tester en local via `python3 -m http.server`.
4. Exporter diagnostic et audit local.
5. Créer le tag `v8.90` après validation.
6. Publier sur Netlify Deploy Preview, puis promouvoir seulement après validation Safari/Chrome.

## Rollback

1. Revenir au tag `v8.81` ou au dernier tag validé.
2. Restaurer le ZIP de sauvegarde local avant migration.
3. Refaire un diagnostic production et un export audit local.
4. Ne pas modifier les DL importées tant que le diagnostic n’est pas vert.

## Backup / restore

- Exporter bibliothèque, audit local, utilisateurs, workflow et diagnostic avant toute publication.
- Conserver le ZIP backup hors navigateur.
- Restore guidé uniquement, jamais automatique destructif.
- Vérifier la compatibilité de version avant import.
