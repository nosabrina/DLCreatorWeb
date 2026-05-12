# Phase 6 — Checklist tests non-régression

## Mode local

- Ouvrir directement `index.html`.
- Vérifier le login legacy.
- Créer une DL.
- Sauvegarder localement.
- Ouvrir la bibliothèque IndexedDB.
- Importer un JSON.
- Exporter un JSON.
- Exporter un PDF.
- Confirmer qu’aucun serveur n’est requis.
- Confirmer qu’aucun e-mail n’est envoyé.
- Confirmer l’absence d’erreur console bloquante.

## Backend Phase 2

- `GET /api/health`.
- Login serveur.
- `GET /api/auth/me`.
- CRUD DL serveur.

## Workflow Phase 3

- Assignation.
- Soumission.
- Refus avec commentaire.
- Validation privée.
- Validation bibliothèque.
- Archivage.

## Bibliothèque Phase 4

- Liste bibliothèque.
- Filtres.
- Détail.
- Compteur nouveautés.

## Dashboard Phase 5

- Summary.
- By-status.
- By-responsible.
- Retards.
- Timeline.
- Export.

## Notifications Phase 6

- `MAIL_ENABLED=false` : aucun envoi réel.
- Dry-run : création d’un log dans `email_notifications`.
- Test SMTP : aucun secret exposé.
- Assignation : notification créée.
- Soumission : notification créée.
- Refus : commentaire inclus.
- Validation bibliothèque : notification créée.
- Erreur SMTP : workflow non cassé.
- Rappels DL non commencées.
- Rappels DL en retard.
- Pas de doublon massif le même jour.
- Logs visibles par Admin.
- Accès refusé pour non-admin.
