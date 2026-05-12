# Phase 7 — Checklist tests pré-production

## Mode local
- Ouverture directe `index.html`.
- Login legacy local.
- Création DL.
- Sauvegarde IndexedDB/localStorage.
- Import/export JSON.
- PDF inchangé.
- Aucune erreur bloquante console.

## Backend
- `/api/health` retourne phase 7.
- Auth serveur OK.
- Compte verrouillé temporairement après échecs répétés.
- Compte désactivé refusé.
- CRUD DL.
- Workflow complet.
- Refus sans commentaire rejeté.
- Bibliothèque serveur.
- Dashboard Admin réservé.
- Notifications dry-run.
- Rappels audités.
- Backup/check-db/restore test.

## Sécurité
- Pas de stack trace en production.
- Pas de secret/token/password/password_hash dans logs.
- CORS strict en production.
- JSON trop grand refusé.
- Rôle front-end ignoré.
