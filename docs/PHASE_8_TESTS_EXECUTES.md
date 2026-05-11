# Phase 8 — Tests réellement effectués

## Effectués dans ce pack

- Décompression du ZIP Phase 7 fourni.
- Inspection de la structure serveur/frontend/docs.
- Contrôle syntaxique JavaScript avec `node --check` sur :
  - `server/src/**/*.js`
  - `server/scripts/*.js`
  - `js/*.js`
- Nettoyage de `js/config.js`.
- Vérification statique de `server/package.json`.
- Correction des migrations SQL non idempotentes Phase 4 et Phase 5.
- Ajout du script `server/scripts/smoke-test-api.js`.
- Documentation d'activation, validation pré-production et limites restantes.

## Non effectués complètement dans cet environnement

`npm install` a été lancé dans `server/`, mais l'installation de `better-sqlite3` n'a pas pu aboutir dans l'environnement d'exécution actuel, car le téléchargement des binaires/headers Node a échoué avec une erreur réseau `EAI_AGAIN` vers `github.com` puis `nodejs.org`.

Conséquence : les tests nécessitant le module natif `better-sqlite3` n'ont pas pu être exécutés ici :

- `npm run check-db`
- `npm run seed:admin`
- `npm start`
- `npm run smoke-test`

## Commandes à rejouer en pré-production locale

```bash
cd server
cp .env.example .env
# Remplacer JWT_SECRET et ADMIN_PASSWORD par des valeurs fortes de test
npm install
npm run seed:admin
npm run check-db
npm start
# autre terminal
npm run smoke-test
```

## Node recommandé

Node 20 LTS ou Node 22 LTS. Le fichier `package.json` indique `>=20 <23` pour rester compatible avec `better-sqlite3` Phase 8.
