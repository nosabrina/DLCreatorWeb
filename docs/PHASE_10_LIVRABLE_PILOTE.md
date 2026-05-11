# Phase 10 — Livrable pilote

## Contenu prêt
- Application locale conservée.
- Backend Phase 9 conservé.
- Documentation serveur, configuration, HTTPS, activation, migration, rôles, sauvegarde, SMTP et checklist.
- Scripts : import JSON DL, création utilisateur, sauvegarde avant import.
- Exemple `.env.pilot.example` sans secrets.
- Exemple Nginx sans certificats.

## À configurer sur serveur cible
- `.env` réel.
- Secrets JWT/Admin/SMTP.
- Reverse proxy HTTPS.
- Service système ou superviseur.
- Sauvegardes réelles.

## Validation
```bash
cd server
npm ci
npm run check-db
npm run seed:admin
npm run smoke-test
```

## Limites
Ce pack est prêt pour pilote, pas pour déclaration de production définitive sans validation terrain SDIS. La validation native `better-sqlite3` doit être faite sur le serveur Node 20 LTS cible.


## Fichiers créés Phase 10
- `docs/PHASE_10_PREREQUIS_SERVEUR.md`
- `docs/PHASE_10_CONFIGURATION_PILOTE.md`
- `docs/PHASE_10_REVERSE_PROXY_HTTPS.md`
- `docs/PHASE_10_ACTIVATION_PROGRESSIVE_BACKEND.md`
- `docs/PHASE_10_MIGRATION_DONNEES_REELLES.md`
- `docs/PHASE_10_UTILISATEURS_ROLES.md`
- `docs/PHASE_10_SAUVEGARDE_RESTAURATION.md`
- `docs/PHASE_10_SMTP_PILOTE.md`
- `docs/PHASE_10_CHECKLIST_DEPLOIEMENT_PILOTE.md`
- `docs/PHASE_10_LIVRABLE_PILOTE.md`
- `server/.env.pilot.example`
- `server/deploy/nginx.dlcreator.example.conf`
- `server/scripts/import-dl-json.js`
- `server/scripts/create-user.js`
- `server/scripts/backup-before-import.js`

## Fichiers modifiés Phase 10
- `app.js` : remplacement ciblé des icônes `-` de suppression par une icône poubelle explicite type `trash.fill`.
- `styles.css` : style de l’icône poubelle.
- `server/package.json` : scripts pilote ajoutés et version Phase 10.
- `server/package-lock.json` : version synchronisée Phase 10.
