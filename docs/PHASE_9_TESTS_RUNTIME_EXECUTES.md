# Phase 9 — Tests runtime réellement exécutés

## Commandes exécutées

```bash
node -v
npm -v
cd server
npm install
npm install --ignore-scripts
npm run seed:admin
npm run check-db
npm start
curl http://localhost:3000/api/health
SMOKE_ADMIN_PASSWORD=*** npm run smoke-test
npm audit --omit=dev
```

## Résultats

- Node : `v22.16.0`
- npm : `10.9.2`
- `npm install` standard : bloqué par `better-sqlite3` et le réseau externe `EAI_AGAIN`.
- `npm install --ignore-scripts` : OK pour validation runtime via fallback Node 22.
- `seed:admin` : OK, Admin initial créé, mot de passe non loggé.
- `check-db` : OK, `quickCheck: ok`.
- `npm start` : OK.
- `/api/health` : OK.
- `npm run smoke-test` : OK.
- `npm audit --omit=dev` : 0 vulnérabilité.

## Smoke tests validés

- health
- login Admin
- auth/me
- création DL
- liste DL
- lecture DL
- modification DL
- assignation
- soumission
- refus sans commentaire = erreur attendue HTTP 400
- refus avec commentaire
- nouvelle soumission
- validation privée
- création seconde DL
- validation bibliothèque
- liste bibliothèque
- compteur nouveautés
- dashboard summary
- notifications dry-run
- run reminders dry-run
- backup check

## Corrections appliquées

1. Ajout `server/src/db/sqlite-adapter.js` pour prioriser `better-sqlite3` et utiliser `node:sqlite` uniquement comme fallback Node 22 de validation.
2. Mise à jour de `server/src/db/database.js` et `server/scripts/check-db.js` pour utiliser l’adaptateur.
3. Correction de `server/src/middleware/error-handler.js` pour transformer les `ZodError` directes en HTTP 400 au lieu de HTTP 500.
4. Mise à jour `nodemailer` vers `^8.0.7`.

## Tests non effectués

- Installation native complète `better-sqlite3` sur Node 20 LTS : non possible dans cet environnement Node 22 avec accès réseau externe bloqué.
- SMTP réel : non effectué volontairement, dry-run conservé.
- Test navigateur manuel complet : non automatisé ; aucun fichier UI métier n’a été modifié.
