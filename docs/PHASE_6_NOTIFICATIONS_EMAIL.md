# Phase 6 — Notifications e-mail serveur et rappels opérationnels

## Objectif

La Phase 6 ajoute un système de notifications e-mail côté serveur pour DL Creator Web, sans modifier le fonctionnement local legacy. Le navigateur ne transmet jamais directement d’e-mails : il appelle uniquement des endpoints serveur sécurisés.

## Configuration SMTP

Variables ajoutées dans `server/.env.example` :

```env
MAIL_ENABLED=false
MAIL_DRY_RUN=true
SMTP_HOST=smtp.example.local
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="DL Creator <no-reply@sdis.local>"
SMTP_REPLY_TO=
MAIL_APP_BASE_URL=http://localhost:3000
MAIL_MAX_RETRIES=3
REMINDER_ENABLED=false
REMINDER_NOT_STARTED_DAYS=7
REMINDER_LATE_DAYS=1
```

Par défaut, aucun e-mail réel n’est envoyé. `MAIL_ENABLED=false` et `MAIL_DRY_RUN=true` permettent de tester toute la chaîne en simulation.

## Dry-run

En dry-run, le serveur :

- rend le template ;
- résout les destinataires côté serveur ;
- écrit une ligne dans `email_notifications` ;
- écrit l’audit `notification.dry_run` ;
- n’ouvre pas de connexion SMTP réelle.

## Templates

Templates créés dans `server/src/services/mail-templates.js` :

- `dl_assigned` ;
- `dl_submitted` ;
- `dl_rejected` ;
- `dl_validated_private` ;
- `dl_validated_library` ;
- `dl_archived` ;
- `dl_not_started_reminder` ;
- `dl_late_reminder`.

Chaque template fournit un sujet clair, un corps texte obligatoire et un HTML simple.

## Événements workflow

Le workflow Phase 3 déclenche maintenant des notifications non bloquantes :

- assignation → `dl_assigned` ;
- soumission → `dl_submitted` ;
- refus → `dl_rejected` ;
- validation privée → `dl_validated_private` ;
- validation bibliothèque → `dl_validated_library` ;
- archivage → `dl_archived`.

Une erreur SMTP ne bloque jamais la transition workflow.

## Rappels

Le service `server/src/services/reminder-service.js` prépare :

- DL assignée mais non commencée ;
- DL en retard selon `due_at` ;
- protection contre les doublons massifs le même jour ;
- journal des runs dans `reminder_runs`.

Aucun cron obligatoire n’est activé en Phase 6. Le lancement est manuel via endpoint Admin.

## Endpoints Admin

Routes ajoutées sous `/api/admin/notifications` :

- `GET /email-log` ;
- `POST /test-smtp` ;
- `POST /test-email` ;
- `POST /run-reminders` ;
- `GET /reminder-runs`.

Accès réservé aux rôles disposant de `admin:dashboard`.

## Journal e-mails

Table `email_notifications` : statut `queued`, `sent`, `dry_run`, `failed`, `skipped`. Les erreurs SMTP sont conservées sans secret SMTP.

## Sécurité

- Aucun mot de passe SMTP stocké en base.
- Aucun secret SMTP loggé.
- Les destinataires sont résolus côté serveur depuis les utilisateurs actifs.
- Les utilisateurs inactifs et les e-mails invalides sont ignorés.
- Les préférences `notification_preferences` sont prévues.
- Le frontend ne peut pas imposer les destinataires workflow.

## Ce qui reste legacy/local

- `index.html` reste ouvrable directement.
- IndexedDB/localStorage restent actifs.
- Login legacy conservé.
- Import/export JSON conservé.
- Export PDF non modifié.

## Limites connues

Non inclus en Phase 6 :

- cron production robuste ;
- file d’attente BullMQ/Redis ;
- relances avancées ;
- interface complète des préférences utilisateur ;
- hardening production complet ;
- stratégie institutionnelle SMTP validée.

## Préparation Phase 7

La Phase 7 pourra ajouter le durcissement production : rotation de secrets, supervision SMTP, job scheduler institutionnel, retries persistants, rate limiting avancé, observabilité et interface Admin complète notifications.
