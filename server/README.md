# Backend minimal pilote — DL Creator Web Phase 2

Ce serveur est optionnel. L’application continue de fonctionner localement avec `index.html`, IndexedDB/localStorage et le login legacy tant que le backend n’est pas activé dans `js/config.js`.

## Installation

```bash
cd server
npm install
cp .env.example .env
```

Modifier `.env` avant démarrage :

```env
SERVER_PORT=3000
DATABASE_URL=./data/dl_creator.sqlite
JWT_SECRET=CHANGE_ME
JWT_EXPIRES_IN=15m
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@sdis.local
ADMIN_DISPLAY_NAME=Administrateur DL Creator
ADMIN_PASSWORD=CHANGE_ME_PASSWORD
```

## Commandes

```bash
npm run seed:admin      # crée l’Admin initial
npm run dev             # démarre en développement
npm start               # démarre en mode production Node
npm run reset:pilot-db  # supprime la base SQLite pilote
```

## Tests rapides

```bash
curl http://localhost:3000/api/health
```

Login :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"CHANGE_ME_PASSWORD"}'
```

DL serveur :

```bash
curl -X POST http://localhost:3000/api/dl \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"title":"DL test","domain":"FOBA","theme":"Test","subtheme":"","publicTarget":"Cadres","jsonData":{"test":true}}'
```

## Sécurité Phase 2

Inclus : bcrypt, JWT, routes protégées, rôle serveur, compte inactif refusé, Helmet, CORS, rate limit login, limite JSON, audit log.

Non inclus : HTTPS, SMTP, workflow validation, reset mot de passe, verrouillage après échecs, dashboard Admin complet, bibliothèque partagée complète.

## Phase 3 — Workflow documentaire serveur

La Phase 3 ajoute un workflow documentaire serveur sans supprimer le mode local historique. Le navigateur ne décide pas des statuts, des rôles ou des droits : les transitions sont validées côté serveur.

### Statuts

`draft`, `assigned`, `in_progress`, `submitted`, `rejected`, `validated_private`, `validated_library`, `archived`.

### Routes workflow

Toutes les routes nécessitent `Authorization: Bearer <accessToken>`.

```bash
# Santé serveur
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"CHANGE_ME"}'

# Créer une DL
curl -X POST http://localhost:3000/api/dl \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"DL test","domain":"FOBA","theme":"Test","jsonData":{"titre":"DL test"}}'

# Assigner
curl -X POST http://localhost:3000/api/dl/$DL_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"assignedToUserId":"USER_ID","comment":"Attribuée pour rédaction"}'

# Soumettre
curl -X POST http://localhost:3000/api/dl/$DL_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"comment":"DL prête pour validation"}'

# Refuser avec commentaire obligatoire
curl -X POST http://localhost:3000/api/dl/$DL_ID/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"comment":"Compléter les objectifs pédagogiques et annexes."}'

# Valider privée
curl -X POST http://localhost:3000/api/dl/$DL_ID/validate-private \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"comment":"Validée pour usage interne ciblé."}'

# Valider bibliothèque
curl -X POST http://localhost:3000/api/dl/$DL_ID/validate-library \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"comment":"Validée et publiable dans la bibliothèque."}'

# Archiver
curl -X POST http://localhost:3000/api/dl/$DL_ID/archive \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"comment":"Ancienne version remplacée."}'

# Historique et commentaires
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dl/$DL_ID/history
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dl/$DL_ID/comments
```

### Séquence de test recommandée

1. Login admin.
2. Créer DL.
3. Assigner.
4. Modifier pour déclencher `in_progress`.
5. Soumettre.
6. Refuser sans commentaire : l'API doit refuser.
7. Refuser avec commentaire.
8. Corriger.
9. Soumettre.
10. Valider privée.
11. Créer une autre DL.
12. Valider bibliothèque.
13. Archiver.
14. Consulter historique.

### Règles de verrouillage

Les statuts `submitted`, `validated_private`, `validated_library` et `archived` bloquent la modification directe via `PUT /api/dl/:id`. Une tentative de modification crée l'audit `dl.update_blocked_locked_status`.

### Bibliothèque Phase 4

La Phase 3 prépare le statut `validated_library`, mais la bibliothèque serveur avancée, les recherches, les compteurs de nouveautés au login et les notifications ne sont pas encore implémentés.

## Phase 4 — Bibliothèque DL partagée serveur

La Phase 4 ajoute une bibliothèque serveur consultable via `/api/library`. Elle ne remplace pas la bibliothèque locale IndexedDB et ne modifie pas le moteur PDF.

### Routes bibliothèque

- `GET /api/library` : liste paginée des DL publiées en bibliothèque, sans `json_data` complet.
- `GET /api/library/:id` : détail complet d'une DL bibliothèque.
- `GET /api/library/stats/new-count` : nombre de DL bibliothèque jamais vues par l'utilisateur connecté.
- `POST /api/library/:id/mark-viewed` : marque une DL comme vue.
- `GET /api/library/filters/options` : valeurs disponibles pour les filtres.

### Filtres disponibles

`domain`, `theme`, `subtheme`, `publicTarget`, `title`, `author`, `version`, `validatedFrom`, `validatedTo`, `publishedFrom`, `publishedTo`, `q`, `limit`, `offset`.

Par défaut, seules les DL `validated_library`, visibles et non archivées sont listées. L'admin peut demander les archives avec `includeArchived=true`.

### Exemples curl

```bash
# Login admin
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"CHANGE_ME_PASSWORD"}'

# Liste bibliothèque
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/library?domain=FOBA&q=ventilation&limit=20&offset=0"

# Détail DL bibliothèque
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/library/DL_ID"

# Compteur nouveautés
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/library/stats/new-count"

# Marquer comme vue
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/library/DL_ID/mark-viewed"
```

### Séquence de test recommandée

1. Login admin.
2. Créer une DL serveur.
3. Soumettre la DL.
4. Valider en bibliothèque avec `/api/dl/:id/validate-library`.
5. Vérifier `GET /api/library`.
6. Consulter le détail avec `GET /api/library/:id`.
7. Vérifier le compteur nouveautés.
8. Marquer comme vue.
9. Vérifier le compteur actualisé.
10. Archiver avec `/api/dl/:id/archive`.
11. Vérifier la disparition par défaut de `/api/library`.

### Audit Phase 4

La bibliothèque alimente `audit_log` et `library_events` pour les actions `library.list`, `library.search`, `library.view`, `library.mark_viewed`, `library.published`, `library.hidden_archived` et `library.access_denied`.

### Limites Phase 4

Non inclus : notifications e-mail, dashboard Admin complet, refonte UI bibliothèque, notifications push/login avancées, gestion fine des groupes.

## Phase 5 — Dashboard Admin serveur

La Phase 5 ajoute un dashboard Admin serveur sous `/api/admin/dashboard`. Les données sont calculées depuis SQLite côté serveur : le navigateur et localStorage ne sont jamais la source de vérité.

### Routes principales

```bash
# Résumé global
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/summary

# Répartition par statut
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/by-status

# Répartition par responsable
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/by-responsible

# DL en retard
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/late

# Activité récente
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/admin/dashboard/recent-activity?limit=20"

# Activité utilisateurs
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/users-activity

# Timeline d'une DL
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/dl/<DL_ID>/timeline

# Export JSON
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/dashboard/export

# Export CSV
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/admin/dashboard/export?format=csv" -o admin-dashboard-dl.csv
```

### Permissions

Permissions ajoutées :

- `admin:dashboard`
- `admin:readStats`
- `admin:readAudit`
- `admin:exportDashboard`
- `admin:readUsersActivity`
- `admin:readLateDocuments`

`admin` possède toutes les permissions. `validator` dispose d'une lecture limitée documentée pour préparer la supervision, mais ne peut pas exporter l'activité utilisateurs complète. Les rôles `read_only`, `creator`, `responsible` et `library_reader` sont refusés pour le dashboard global.

### Champs échéances

La migration Phase 5 ajoute à `dl_documents` :

- `due_at`
- `assigned_at`
- `first_saved_at`

`assigned_at` est renseigné à l'assignation. `first_saved_at` est renseigné lors de la première sauvegarde serveur significative. `due_at` reste optionnel en Phase 5.

### Séquence de test recommandée

1. Login admin.
2. Créer plusieurs DL.
3. Assigner certaines DL.
4. Passer certaines DL en rédaction.
5. Soumettre une DL.
6. Refuser une DL avec commentaire obligatoire.
7. Valider une DL privée.
8. Valider une DL bibliothèque.
9. Consulter `/summary`.
10. Consulter `/by-status`.
11. Consulter `/by-responsible`.
12. Consulter `/late`.
13. Consulter `/dl/:id/timeline`.
14. Exporter le rapport JSON ou CSV.

### Limites Phase 5

- Pas d'e-mails automatiques SMTP.
- Pas de rappels automatiques.
- Pas d'UI Admin complète.
- Pas de graphiques avancés.
- Pas de PDF Admin.
- Le mode local IndexedDB/localStorage reste conservé.

## Phase 6 — Notifications e-mail serveur

Installer les dépendances serveur après mise à jour :

```bash
cd server
npm install
```

Variables principales :

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

Par défaut, le mode dry-run journalise les notifications sans envoi SMTP réel.

Endpoints Admin :

```bash
POST /api/admin/notifications/test-smtp
POST /api/admin/notifications/test-email
POST /api/admin/notifications/run-reminders
GET  /api/admin/notifications/email-log
GET  /api/admin/notifications/reminder-runs
```

Séquence de test recommandée :

1. Configurer `MAIL_ENABLED=false` et `MAIL_DRY_RUN=true`.
2. Se connecter avec un compte Admin.
3. Créer une DL.
4. Assigner la DL.
5. Vérifier la notification dry-run.
6. Soumettre la DL.
7. Refuser avec commentaire.
8. Valider en bibliothèque.
9. Lancer les rappels.
10. Consulter les logs e-mail.

Aucun e-mail n’est envoyé depuis le navigateur. Les destinataires workflow sont résolus côté serveur depuis les utilisateurs actifs.


## Phase 9 — Validation runtime Node

La cible recommandée reste Node 20 LTS avec `better-sqlite3`. Un fallback contrôlé `node:sqlite` permet de valider les routes API sous Node 22 lorsque `better-sqlite3` n’est pas installable dans l’environnement de test.

```bash
cp .env.example .env
npm install
npm run seed:admin
npm run check-db
npm start
npm run smoke-test
```

Voir `docs/PHASE_9_RUNTIME_NODE.md`, `docs/PHASE_9_TESTS_RUNTIME_EXECUTES.md` et `docs/PHASE_9_PRE_PRODUCTION_VALIDEE.md`.

## Phase 10 — pilote serveur

Commandes ajoutées :

```bash
npm run create-user -- --username jdupont --email j.dupont@sdis.local --role responsible
npm run backup-before-import
npm run import-dl-json -- --file ../exports/dl-test.json --owner admin
npm run import-dl-json -- --dir ../exports --owner admin --status draft
```

La configuration pilote doit partir de `.env.pilot.example`. Aucun secret, aucune base réelle, aucun backup et aucun log ne doivent être committés ou intégrés au ZIP de livraison.
