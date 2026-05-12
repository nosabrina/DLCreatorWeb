# Phase 7 — Déploiement production

## Prérequis
Serveur Linux, Node.js LTS, HTTPS via reverse proxy, compte système dédié, disque sauvegardé, SMTP institutionnel validé.

## Installation
```bash
cd server
npm install
cp .env.example .env
npm run seed:admin
npm run check-db
npm start
```

## Variables critiques
`NODE_ENV=production`, `JWT_SECRET` fort, `CORS_ORIGIN` officiel, `APP_PUBLIC_URL`, `DATABASE_URL`, `DATABASE_BACKUP_DIR`, `MAIL_DRY_RUN=true` jusqu’à validation SMTP, `TRUST_PROXY=true` uniquement derrière reverse proxy maîtrisé.

## Reverse proxy
HTTPS obligatoire. Nginx/Apache/Caddy recommandé devant `localhost:3000`. HSTS après validation.

## Sauvegarde/restauration
```bash
npm run backup
npm run check-db
npm run restore -- ./backups/dl_creator_xxx.sqlite --force
```
Tester la restauration sur une copie avant toute production.

## Logs
En production, les logs structurés sont écrits dans `LOG_DIR`. Prévoir logrotate ou collecte centralisée.

## SMTP
Valider en dry-run, puis passer `MAIL_ENABLED=true` et `MAIL_DRY_RUN=false` uniquement après accord.

## Supervision
Exemples fournis : `server/ecosystem.config.example.js` et `server/systemd/dl-creator-web.service.example`.

## Rollback
Sauvegarder DB, déployer, vérifier `/api/health`, tester parcours métier. En cas d’échec, restaurer sauvegarde et version précédente.
