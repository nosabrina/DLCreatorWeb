# DL Creator Web — Migration vers application multi-utilisateurs sécurisée

## 1. Verdict technique

L'application actuelle est une application locale offline-first. Elle est utilisable poste par poste, mais elle ne peut pas assurer une sécurité réelle ni un workflow SDIS partagé, car les données de session, de profil, de validation et de bibliothèque sont stockées dans le navigateur.

Points constatés dans le ZIP actuel :

- `app.js` monolithique : logique métier, UI, stockage, validation, PDF, imports, CSV et bibliothèque dans un seul fichier.
- `styles.css` monolithique.
- `index.html` charge uniquement `styles.css` et `app.js`.
- Login local via `localStorage`.
- Hash mot de passe côté navigateur avec SHA-256.
- Session locale via `DL_CREATOR_WEB_SESSION_V1`.
- Profil local via `DL_CREATOR_WEB_PROFILE_V1`.
- Bibliothèque locale via IndexedDB.
- Validation basée sur `APP.state.user.function === 'Chef formation'`, donc modifiable côté navigateur.
- CSV chargés localement depuis `data/*.csv`.
- Export/import JSON encore indispensable pour la phase transitoire.

Conclusion : un backend serveur est obligatoire pour les comptes, rôles, statuts, validations, e-mails, historique et bibliothèque commune.

## 2. Architecture cible progressive

### Frontend conservé

Le frontend actuel doit être conservé comme base fonctionnelle. La migration doit se faire par extraction progressive des responsabilités :

- `auth.js` : connexion, session, utilisateur courant.
- `dl-model.js` : modèle DL, compatibilité JSON, migrations de schéma.
- `dl-storage-api.js` : lecture/écriture serveur, fallback temporaire local.
- `library.js` : bibliothèque DL partagée.
- `validation-workflow.js` : statuts et transitions côté serveur.
- `notifications.js` : affichage des notifications reçues du serveur.
- `pdf-export.js` : export PDF, à conserver le plus stable possible.
- `autocomplete.js` : CSV locaux puis référentiels serveur.
- `admin-dashboard.js` : suivi Admin.
- `permissions.js` : affichage conditionnel côté UI, sans être source de vérité.

### Backend recommandé

Pour une première version pilote :

- Node.js + Express.
- PostgreSQL recommandé.
- SQLite serveur accepté temporairement pour un pilote isolé.
- Stockage fichiers local serveur au départ : `server/storage`.
- SMTP institutionnel pour les e-mails.
- Sessions serveur sécurisées via cookie `httpOnly`, `secure`, `sameSite=strict`.
- Hash mot de passe serveur avec Argon2id ou bcrypt.

## 3. Rôles serveur

Rôles minimaux :

| Rôle | Droits principaux |
|---|---|
| Créateur | Crée, modifie ses brouillons, soumet à validation, consulte ses DL. |
| Responsable désigné | Voit les DL attribuées, état non commencé / en cours / soumis. |
| Validateur / Chef formation | Valide, refuse avec commentaire, décide bibliothèque oui/non. |
| Admin | Voit tout, attribue, gère utilisateurs, consulte historique et statistiques. |
| Lecture seule | Consulte uniquement les DL autorisées. |
| Bibliothèque interne | Consulte les DL validées publiées. |

Important : le rôle navigateur ne doit jamais décider réellement d'une action sensible. Le serveur doit toujours vérifier.

## 4. Workflow documentaire serveur

Statuts recommandés :

1. `draft` — Brouillon.
2. `assigned` — Assignée.
3. `in_progress` — En rédaction.
4. `submitted` — Soumise à validation.
5. `rejected` — Refusée / à corriger.
6. `validated_private` — Validée privée.
7. `validated_library` — Validée bibliothèque.
8. `archived` — Archivée.

Règles obligatoires :

- Refus impossible sans commentaire.
- Validation impossible sans décision bibliothèque oui/non.
- DL validée non modifiable directement.
- Toute modification d'une DL validée crée une nouvelle version.
- Changement de statut uniquement par API serveur.
- Historique automatique à chaque transition.

## 5. Modèle de données serveur recommandé

Tables minimales :

- `users`
- `roles`
- `user_roles`
- `dl_documents`
- `dl_versions`
- `dl_assignments`
- `dl_permissions`
- `dl_files`
- `workflow_events`
- `audit_log`
- `email_notifications`
- `login_events`
- `library_read_state`
- `app_settings`

## 6. API nécessaires

### Authentification

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/reset-password/request`
- `POST /api/auth/reset-password/confirm`

### Utilisateurs / rôles

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `POST /api/users/:id/disable`
- `GET /api/roles`
- `PUT /api/users/:id/roles`

### DL

- `GET /api/dl`
- `POST /api/dl`
- `GET /api/dl/:id`
- `PUT /api/dl/:id`
- `POST /api/dl/:id/submit`
- `POST /api/dl/:id/validate`
- `POST /api/dl/:id/reject`
- `POST /api/dl/:id/archive`
- `POST /api/dl/:id/new-version`

### Bibliothèque

- `GET /api/library`
- `GET /api/library/new-count`
- `POST /api/library/:id/read`

### Fichiers

- `POST /api/dl/:id/files`
- `GET /api/dl/:id/files/:fileId`
- `DELETE /api/dl/:id/files/:fileId`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/audit-log`
- `GET /api/admin/statistics`
- `POST /api/admin/dl/:id/assign`

## 7. Stratégie e-mails

Les e-mails doivent être envoyés par le serveur, jamais par le navigateur.

Notifications minimales :

- DL assignée.
- Rappel DL non commencée.
- DL soumise à validation.
- DL validée.
- DL refusée avec commentaire.
- DL publiée dans la bibliothèque.
- Retard signalé à l'Admin.

Chaque envoi doit être inscrit dans `email_notifications` avec statut `pending`, `sent` ou `failed`.

## 8. Sécurité fichiers et contenus riches

À imposer côté serveur :

- PDF : taille maximale paramétrable.
- Images : taille maximale, type MIME contrôlé.
- Word : uniquement si nécessaire, taille limitée.
- Rejet des fichiers exécutables.
- Noms de fichiers réécrits côté serveur.
- Nettoyage HTML riche avant stockage ou avant rendu partagé.
- Protection XSS.
- Quotas par DL.
- Journalisation upload/suppression.

## 9. Plan de migration

### Phase 1 — Stabilisation sans rupture

- Documenter le modèle JSON actuel.
- Ajouter une couche API côté frontend sans l'activer par défaut.
- Isoler progressivement le modèle DL.
- Identifier tous les accès directs `localStorage` et `IndexedDB`.
- Préserver import/export JSON.
- Ne pas modifier l'export PDF sauf nécessité.

### Phase 2 — Backend minimal

- Créer auth serveur.
- Créer utilisateurs/rôles.
- Créer sauvegarde serveur des DL.
- Ajouter migration JSON locale vers serveur.

### Phase 3 — Workflow serveur

- Statuts serveur.
- Soumission, refus, validation.
- Commentaires obligatoires.
- Décision bibliothèque.

### Phase 4 — Bibliothèque partagée

- Recherche serveur.
- Filtres.
- Droits lecture.
- Compteur nouveautés au login.

### Phase 5 — Dashboard Admin

- Suivi DL par statut.
- DL non commencées.
- Retards.
- Responsable par DL.
- Historique.

### Phase 6 — Notifications

- SMTP.
- Templates.
- Journal des envois.
- Rappels programmés.

### Phase 7 — Durcissement production

- Sauvegardes.
- Logs serveur.
- RGPD.
- Tests.
- Monitoring.
- Reverse proxy HTTPS.

## 10. Priorité des travaux

1. Backend auth + base utilisateurs.
2. Modèle DL serveur + sauvegarde.
3. RBAC serveur.
4. Workflow validation.
5. Bibliothèque centrale.
6. Audit trail.
7. Dashboard Admin.
8. E-mails serveur.
9. Migration CSV vers référentiels serveur si nécessaire.
10. Refactorisation progressive de `app.js`.

## 11. Risques de régression

- Export PDF fragile : ne pas le refondre pendant la migration auth.
- Import/export JSON : indispensable pendant la transition.
- CSV : conserver le chargement local tant que les référentiels serveur ne sont pas validés.
- IndexedDB : ne pas supprimer avant migration complète.
- Validation actuelle : ne pas l'utiliser comme sécurité réelle.
- App.js monolithique : extraction progressive uniquement, fonction par fonction.
