# Phase 9 — Runtime Node validé

## Environnement contrôlé

- Date de validation : 07.05.2026
- Node disponible pour les tests : `v22.16.0`
- npm disponible pour les tests : `10.9.2`
- Runtime recommandé pour pré-production institutionnelle : Node 20 LTS

## Résultat `npm install`

`npm install` standard a été tenté. Le blocage constaté vient de `better-sqlite3` : téléchargement des prébuilds et headers Node impossible dans cet environnement (`EAI_AGAIN` vers github.com/nodejs.org).

Pour valider réellement le runtime applicatif malgré cette contrainte réseau/native, l’installation de validation a été faite avec :

```bash
npm install --ignore-scripts
```

Un adaptateur SQLite contrôlé a été ajouté : `better-sqlite3` reste prioritaire ; si indisponible sous Node 22, le fallback `node:sqlite` permet de valider les routes API. La cible recommandée reste Node 20 LTS + `better-sqlite3` installé normalement.

## Dépendances

- `nodemailer` mis à jour vers `^8.0.7`.
- `npm audit --omit=dev` final : 0 vulnérabilité.
- `node_modules` ne doit pas être livré.

## Commandes recommandées

```bash
cd server
cp .env.example .env
# modifier JWT_SECRET et ADMIN_PASSWORD
npm install
npm run seed:admin
npm run check-db
npm start
npm run smoke-test
```
