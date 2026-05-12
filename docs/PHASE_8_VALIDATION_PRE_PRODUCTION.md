# Phase 8 — Checklist validation pré-production

## Pack

- ZIP propre et décompressible.
- `app.js`, `styles.css`, CSV et moteur PDF non modifiés sauf nécessité documentée.
- `index.html` ouvrable directement en local.

## Serveur

- `npm install` OK dans `server/`.
- Node recommandé : 20 LTS ou 22 LTS.
- `.env` créé depuis `.env.example` avec secrets réels de test.
- `npm run seed:admin` OK.
- `npm run check-db` OK.
- `npm start` démarre sans erreur runtime.
- `/api/health` répond OK.

## Tests API

- `npm run smoke-test` OK.
- Login Admin OK.
- `/api/auth/me` OK.
- Création, lecture, liste, modification DL OK.
- Assignation, soumission, refus avec commentaire obligatoire, nouvelle soumission OK.
- Validation privée OK.
- Validation bibliothèque OK.
- Bibliothèque et compteur nouveautés OK.
- Dashboard summary OK.
- Notifications dry-run OK.
- Rappels dry-run OK.
- Backup OK.

## Non-régression locale

- Login legacy OK.
- Création DL locale OK.
- Sauvegarde IndexedDB OK.
- Bibliothèque locale OK.
- Import/export JSON OK.
- Export PDF OK.
- Aucun appel serveur obligatoire.
- Aucune erreur console bloquante.

## Exploitation

- Logs lisibles.
- Audit alimenté.
- Sauvegarde créée.
- Restore testé sur copie de pré-production.
- Rollback possible vers mode local.
