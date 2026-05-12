# Rapport GitHub hardening — v9.10

## Résultat

Structure prête pour dépôt GitHub privé.

## Ajouts / renforcements

- `.gitignore` renforcé pour secrets, logs, diagnostics, audits, dumps IndexedDB et exports locaux.
- `.env.example` placé à la racine avec placeholders uniquement.
- Documentation projet renforcée : README, SECURITY, CONTRIBUTING, DEPLOYMENT, ROLLBACK, TESTS, VERSION.
- Dossier `config/` ajouté pour la configuration runtime publique.
- Documentation `docs/` ajoutée pour architecture, sécurité, offline-first et Netlify Preview.

## Garde-fous

- `.env` réel exclu.
- Données locales/exportées exclues.
- Aucun secret requis pour démarrer en localhost.
