# Phase 5 — Dashboard Admin serveur et suivi opérationnel DL

## Objectif

La Phase 5 ajoute un dashboard Admin réellement calculé côté serveur. Le navigateur n'est jamais la source de vérité du suivi opérationnel. Le mode local offline-first, IndexedDB, localStorage, le login legacy, l'import/export JSON et le moteur PDF existant restent inchangés.

## Droits d'accès

Permissions ajoutées côté serveur :

- `admin:dashboard`
- `admin:readStats`
- `admin:readAudit`
- `admin:exportDashboard`
- `admin:readUsersActivity`
- `admin:readLateDocuments`

Le rôle `admin` possède toutes ces permissions. Le rôle `validator` reçoit uniquement une capacité de consultation limitée (`admin:dashboard`, `admin:readStats`, `admin:readLateDocuments`, `admin:readAudit`) afin de préparer une supervision future. Les rôles `read_only`, `creator`, `responsible` et `library_reader` n'ont pas accès au dashboard global.

## Endpoints

Base : `/api/admin/dashboard`

- `GET /summary`
- `GET /by-status`
- `GET /by-responsible`
- `GET /late`
- `GET /recent-activity`
- `GET /users-activity`
- `GET /dl/:id/timeline`
- `GET /export?format=json|csv`

Toutes les routes utilisent l'authentification serveur et les permissions serveur. Les refus retournent une erreur API claire.

## Indicateurs globaux

`GET /summary` retourne les compteurs globaux : total DL, assignées, non commencées, en rédaction, soumises, refusées, validées privées, publiées bibliothèque, archivées, retards, utilisateurs actifs et horodatage du calcul.

Les DL soft-deleted (`deleted_at` non nul) ne sont pas comptées.

## Définition “non commencée”

Une DL est considérée non commencée lorsqu'elle est au statut `assigned` et que `first_saved_at` est nul. Le champ `first_saved_at` est renseigné lors de la première sauvegarde serveur significative qui fait passer une DL assignée/refusée en `in_progress`.

## Définition “retard”

La Phase 5 ajoute les champs `due_at`, `assigned_at` et `first_saved_at` à `dl_documents`.

Une DL est en retard si :

1. `due_at` est renseigné, dépassé, et le statut n'est pas final ;
2. ou, règle transitoire documentée, elle est au statut `assigned` depuis plus de `ADMIN_DASHBOARD_TRANSITIONAL_LATE_DAYS` jours sans progression.

Valeur par défaut de la règle transitoire : 14 jours.

Les statuts finaux sont `validated_private`, `validated_library` et `archived`.

## Suivi par statut

`GET /by-status` couvre :

- `draft`
- `assigned`
- `in_progress`
- `submitted`
- `rejected`
- `validated_private`
- `validated_library`
- `archived`

Les statuts inconnus sont regroupés en `unknown` si nécessaire.

## Suivi par responsable

`GET /by-responsible` regroupe les DL par responsable assigné, ou par propriétaire si aucun responsable n'est assigné. Les compteurs incluent les statuts principaux et les retards. L'option `includeInactive=true` permet d'inclure les utilisateurs inactifs.

## Timeline DL

`GET /dl/:id/timeline` fusionne :

- historique de statuts ;
- commentaires ;
- audit log ;
- événements bibliothèque ;
- versions DL.

La route ne remplace pas `/api/dl/:id/history` de la Phase 3.

## Activité utilisateur

`GET /users-activity` expose uniquement les données utiles au pilotage : rôle, état actif, dernier login, nombres de DL possédées/assignées/soumises/validées et dernière action. Le champ `password_hash` n'est jamais exposé.

## Export rapport

`GET /export?format=json` retourne un rapport structuré.

`GET /export?format=csv` retourne un CSV simple séparé par `;` contenant résumé, statuts, responsables et retards.

Aucun PDF Admin complexe n'est généré en Phase 5.

## Module front-end préparatoire

Le fichier `js/admin-dashboard.js` expose des fonctions API, mais ne crée pas de faux dashboard local. Il ne fait rien si :

- le backend est désactivé ;
- `adminDashboardEnabled` est désactivé ;
- le client API serveur n'est pas disponible.

## Limites connues

- Pas encore d'interface Admin complète.
- Pas encore de graphiques avancés.
- Pas encore de notifications e-mail.
- Pas encore de rappels automatiques.
- Pas encore de hardening production complet.
- `due_at` est prêt côté schéma, mais son alimentation métier complète dépendra de la phase de planification/assignation avancée.

## Ce qui reste legacy/local

- IndexedDB local.
- localStorage legacy.
- login local historique.
- ouverture directe de `index.html`.
- import/export JSON local.
- moteur PDF existant.

## Préparation Phase 6

La Phase 5 prépare les notifications e-mail et rappels automatiques grâce à :

- `due_at` ;
- `assigned_at` ;
- `first_saved_at` ;
- endpoint `/late` ;
- activité récente ;
- timeline DL ;
- audit d'export et de consultation Admin.
