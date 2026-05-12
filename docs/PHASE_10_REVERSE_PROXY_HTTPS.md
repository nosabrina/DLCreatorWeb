# Phase 10 — Reverse proxy HTTPS

HTTPS est obligatoire pour le pilote utilisateur. Express reste derrière Nginx ou un reverse proxy équivalent.

Principes :
- Web et API sous le même domaine si possible.
- CORS strict sur le domaine public.
- `TRUST_PROXY=true` dans `.env` si reverse proxy.
- Taille body adaptée aux JSON DL : exemple `client_max_body_size 60m`.
- Logs proxy conservés et surveillés.
- Certificat renouvelé automatiquement.

Un exemple est fourni : `server/deploy/nginx.dlcreator.example.conf`.

HTTP seul est acceptable uniquement pour validation locale isolée.
