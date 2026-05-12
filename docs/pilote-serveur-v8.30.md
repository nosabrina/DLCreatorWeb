# DL Creator Web v8.30 — Déploiement pilote contrôlé

## Objectif

La v8.30 transforme la base v8.20 en pilote serveur contrôlé exploitable sur Netlify/GitHub, sans rendre le backend obligatoire et sans toucher au moteur PDF verrouillé.

## Principes verrouillés

- Offline-first prioritaire.
- Backend préparatoire désactivé par défaut.
- Synchronisation distante désactivée par défaut.
- Authentification serveur mockée/préparatoire uniquement.
- PDF, aperçu A4, pagination et annexes PDF non modifiés volontairement.

## Déploiement Netlify

1. Publier le dépôt GitHub.
2. Relier le site Netlify au dépôt.
3. Contrôler `netlify.toml` : publish `.`, functions `netlify/functions`, headers sécurité, cache, fallback SPA.
4. Déployer en preview puis branch deploy.
5. Vérifier `/.netlify/functions/health`.
6. Vérifier l’application en Safari et Chrome.

## Variables d’environnement pilotes

- `DL_CREATOR_ENV=preview|production`
- `DL_CREATOR_BACKEND_ENABLED=false`
- `DL_CREATOR_MAIL_PROVIDER=disabled`
- `ENABLE_REMOTE_SYNC=false`
- `ENABLE_AUDIT_SERVER=false`

## GitHub

Branches recommandées :

- `main` : version stable.
- `dev` : intégration.
- `pilote` : tests terrain.
- `release/v8.30` : gel de livraison.
- `hotfix/*` : corrections urgentes sans refonte.

## Contrôles obligatoires

- `node scripts/check-critical-files.js`
- `node scripts/check-js-syntax.js`
- Test manuel ouverture application.
- Test import/export JSON.
- Test aperçu A4 et impression/export PDF via le flux existant.
- Test Diagnostic production.
- Test fallback offline avec réseau coupé.

## Limites volontaires

- Pas d’auth cloud définitive.
- Pas de synchronisation temps réel.
- Pas d’envoi e-mail réel.
- Pas de migration destructive.
- Pas de modification PDF.
