# Déploiement Netlify

## Préproduction

1. Créer un dépôt GitHub.
2. Pousser la branche `develop`.
3. Créer un Deploy Preview Netlify.
4. Tester ouverture, menus, bibliothèque, import/export JSON, mots clés, import Word, aperçu A4, impression et annexes PDF.

## Production

1. Fusionner vers `main`.
2. Tagger `v8.30`.
3. Déployer depuis Netlify.
4. Contrôler le Diagnostic production.

## Variables préparées

- `DL_CREATOR_ENV`
- `DL_CREATOR_BACKEND_ENABLED`
- `DL_CREATOR_MAIL_PROVIDER`

Aucun secret ne doit être commité dans GitHub.
