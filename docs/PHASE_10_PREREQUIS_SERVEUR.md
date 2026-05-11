# Phase 10 — Prérequis serveur cible

## Cible recommandée
- Linux stable à jour, par exemple Debian 12 ou Ubuntu Server LTS.
- Node.js 20 LTS obligatoire pour le pilote.
- npm fourni avec Node 20.
- Utilisateur système dédié, sans exécution en root.
- Disque persistant pour `server/data`, `server/backups` et `server/logs`.
- Reverse proxy HTTPS devant Express.
- SMTP institutionnel disponible, mais désactivé au départ.
- Monitoring minimal : espace disque, service Node, logs applicatifs, logs proxy.

## Outils build pour better-sqlite3
`better-sqlite3` est une dépendance native. Sur serveur cible, prévoir les outils de compilation si le binaire précompilé n’est pas disponible.

Exemple Debian/Ubuntu :
```bash
sudo apt update
sudo apt install -y build-essential python3 make g++
node -v
npm -v
```

## Validation pilote
```bash
cd server
npm ci
npm run check-db
npm run seed:admin
npm start
npm run smoke-test
```

## Points d’attention
- Ne jamais livrer `node_modules`.
- Ne jamais livrer `.env` réel.
- Ne jamais livrer la base réelle, les backups ou les logs.
- En cas d’erreur `better-sqlite3`, vérifier Node 20 LTS, les outils build, les droits d’écriture et l’architecture CPU.
- HTTP seul est réservé au test local. Le pilote utilisateur doit passer par HTTPS.
