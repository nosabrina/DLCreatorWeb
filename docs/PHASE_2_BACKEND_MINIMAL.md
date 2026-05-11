# Phase 2 — Backend minimal pilote DL Creator Web

## Objectif

La Phase 2 ajoute un backend pilote réellement fonctionnel sans remplacer le fonctionnement local existant. Par défaut, `index.html` continue de démarrer en mode local/offline-first avec IndexedDB/localStorage et le login legacy existant.

Le backend devient utilisable uniquement si `js/config.js` est modifié volontairement :

```js
backendEnabled: true,
featureFlags: {
  authServerEnabled: true,
  dlServerStorageEnabled: true
}
```

## Architecture livrée

- Front existant conservé.
- Modules Phase 1 complétés : `api-client`, `auth-client`, `dl-storage-api`.
- Serveur Node.js/Express dans `server/`.
- Base SQLite locale serveur.
- Authentification serveur par mot de passe hashé bcrypt.
- JWT access token courte durée.
- Refresh token stocké côté serveur sous forme hashée.
- API DL serveur avec sauvegarde du JSON complet.
- Audit log minimal.

## Ce qui est réellement sécurisé en Phase 2

- Mot de passe vérifié côté serveur.
- Mot de passe hashé avec bcrypt.
- Rôle utilisateur lu depuis la base serveur, jamais depuis le navigateur.
- Routes DL protégées par `Authorization: Bearer <token>`.
- Compte inactif refusé.
- Admin initial créé via variables `.env`, sans mot de passe hardcodé.
- Suppression DL en soft delete.
- Audit log pour login, logout, création, modification, suppression.
- Helmet, CORS configuré, rate limit global et rate limit login.
- Limite JSON côté API.

## Ce qui reste legacy/local et non sécurisé

- Le mode local reste le comportement par défaut.
- Le login legacy local reste dans le navigateur et n’est pas une sécurité multi-utilisateurs.
- IndexedDB/localStorage restent actifs pour ne pas casser l’application.
- Le serveur n’est pas imposé au chargement de l’application.
- Le workflow validation/e-mail/bibliothèque partagée n’est pas encore implémenté.
- HTTPS, verrouillage après échecs, reset mot de passe, SMTP et RGPD complet restent à traiter en phases suivantes.

## Installation serveur

```bash
cd server
npm install
cp .env.example .env
```

Modifier `.env` :

```env
SERVER_PORT=3000
DATABASE_URL=./data/dl_creator.sqlite
JWT_SECRET=remplacer-par-un-secret-long-aleatoire-minimum-32-caracteres
JWT_EXPIRES_IN=15m
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@sdis.local
ADMIN_PASSWORD=UnVraiMotDePasseLong!
```

Le serveur refuse un `JWT_SECRET` faible ou laissé sur `change-me`.

## Création Admin initial

```bash
npm run seed:admin
```

Le script crée l’Admin uniquement s’il n’existe pas déjà. Le mot de passe n’est jamais affiché.

## Lancement

```bash
npm run dev
```

Healthcheck :

```bash
curl http://localhost:3000/api/health
```

## Endpoints disponibles

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/dl`
- `POST /api/dl`
- `GET /api/dl/:id`
- `PUT /api/dl/:id`
- `DELETE /api/dl/:id`
- `GET /api/admin/audit-log` réservé Admin
- `GET /api/admin/dashboard` réservé Admin

## Exemples API

Login :

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"UnVraiMotDePasseLong!"}' | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).accessToken))")
```

Utilisateur courant :

```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Créer une DL serveur :

```bash
curl -X POST http://localhost:3000/api/dl \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"DL test","domain":"FOBA","theme":"Test","subtheme":"","publicTarget":"Cadres","jsonData":{"source":"phase2"}}'
```

Lister les DL :

```bash
curl http://localhost:3000/api/dl -H "Authorization: Bearer $TOKEN"
```

## Tests navigateur

Par défaut, rien ne change dans le navigateur.

Pour activer un diagnostic Phase 2, modifier temporairement `js/config.js` :

```js
backendEnabled: true,
serverDiagnosticsEnabled: true,
featureFlags: {
  authServerEnabled: true,
  dlServerStorageEnabled: true
}
```

Un petit panneau de diagnostic apparaît en bas à droite et permet de tester : health, login serveur, utilisateur courant, sauvegarde DL serveur et liste DL serveur.

## Limites connues

- Pas de workflow validation Phase 3.
- Pas d’e-mails serveur.
- Pas de dashboard Admin complet.
- Pas de bibliothèque serveur partagée.
- Pas de refresh automatique du JWT côté navigateur.
- Session stockée en `sessionStorage` pour le pilote ; en production, privilégier cookies secure/httpOnly derrière HTTPS.
- SQLite convient au pilote local ; PostgreSQL sera préférable pour production multi-utilisateurs.

## Préparation Phase 3

La Phase 3 pourra ajouter :

- workflow `draft → submitted → validated/rejected` ;
- décision d’intégration bibliothèque à la validation ;
- droits lecture seule ;
- notifications e-mail serveur ;
- suivi Admin des DL commencées/non commencées ;
- politiques de mot de passe ;
- verrouillage compte après échecs ;
- audit trail consultable ;
- migration progressive IndexedDB → serveur.
