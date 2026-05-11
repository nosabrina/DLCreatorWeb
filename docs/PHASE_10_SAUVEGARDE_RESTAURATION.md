# Phase 10 — Sauvegarde / restauration pilote

## Sauvegarde
- Sauvegarde SQLite quotidienne minimale.
- Sauvegarde avant mise à jour.
- Sauvegarde avant import réel.
- Backups stockés hors répertoire web public.

Commandes :
```bash
npm run backup
npm run backup-before-import
```

## Restauration test
Tester la restauration sur copie ou environnement pilote isolé :
```bash
npm run restore -- --file ./backups/nom-du-backup.sqlite
npm run check-db
npm run smoke-test
```

Aucune base ne doit être écrasée sans sauvegarde préalable. Les backups doivent être protégés comme des données opérationnelles.
