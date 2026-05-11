# Phase 9 — Pack prêt validation pré-production

## État

Pack prêt pour validation pré-production serveur. Il ne doit pas être annoncé comme production institutionnelle finale tant que `npm install` complet avec `better-sqlite3` n’a pas été validé sur le serveur cible Node 20 LTS.

## Mode local conservé

- `backendEnabled: false` par défaut.
- `storageMode: local` conservé.
- Ouverture directe de `index.html` conservée.
- IndexedDB/localStorage conservés.
- Login legacy conservé.
- Import/export JSON conservé.
- PDF non modifié.
- CSV non modifiés.

## Lancement pré-production

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

## Limites restantes

- Valider `better-sqlite3` natif sur Node 20 LTS dans l’environnement cible.
- Définir sauvegardes, supervision, reverse proxy HTTPS et politique logs.
- Activer SMTP réel uniquement après validation institutionnelle.
