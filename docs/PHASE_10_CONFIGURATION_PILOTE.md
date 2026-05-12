# Phase 10 — Configuration pilote

Créer `server/.env` depuis `server/.env.pilot.example`, puis remplacer toutes les valeurs sensibles.

Variables clés :
- `NODE_ENV=production`
- `APP_PUBLIC_URL=https://...`
- `CORS_ORIGIN=https://...`
- `JWT_SECRET` : secret aléatoire fort, jamais commité.
- `DATABASE_URL=./data/dl_creator.sqlite`
- `DATABASE_BACKUP_DIR=./backups`
- `LOG_DIR=./logs`
- `MAIL_ENABLED=false` au départ.
- `MAIL_DRY_RUN=true` au départ.
- `SMTP_*` renseigné seulement lors du test SMTP encadré.

Commandes :
```bash
cp .env.pilot.example .env
npm ci
npm run check-db
npm run seed:admin
npm run smoke-test
```

Aucun secret réel ne doit être ajouté au ZIP. Le SMTP réel reste désactivé jusqu’à validation du dry-run.
