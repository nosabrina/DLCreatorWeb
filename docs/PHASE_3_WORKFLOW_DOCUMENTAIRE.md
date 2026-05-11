# Phase 3 — Workflow documentaire serveur

## Objectif

La Phase 3 ajoute un workflow documentaire serveur complet au backend pilote de DL Creator Web, sans remplacer le mode local historique.

Le mode local `index.html` + `localStorage` + `IndexedDB` reste fonctionnel et indépendant. Le workflow Phase 3 n'est disponible que lorsque le backend est activé dans `js/config.js` et que les appels API serveur sont utilisés.

## Statuts serveur

Statuts implémentés côté serveur :

- `draft` : brouillon visible par le créateur et les Admin.
- `assigned` : DL attribuée à un responsable.
- `in_progress` : DL en rédaction, activée par première sauvegarde serveur significative ou correction après refus.
- `submitted` : DL soumise à validation, verrouillée en modification directe.
- `rejected` : DL refusée avec commentaire obligatoire, à nouveau modifiable par créateur/responsable.
- `validated_private` : DL validée sans publication bibliothèque.
- `validated_library` : DL validée et marquée publiable dans la future bibliothèque serveur.
- `archived` : DL archivée, consultation uniquement.

Le navigateur ne décide jamais du statut final. Le champ `status` reçu dans les payloads DL est ignoré pour les décisions workflow.

## Transitions autorisées

Transitions strictes :

- `draft` → `assigned`
- `draft` → `in_progress`
- `assigned` → `in_progress`
- `in_progress` → `submitted`
- `submitted` → `rejected`
- `submitted` → `validated_private`
- `submitted` → `validated_library`
- `rejected` → `in_progress`
- `validated_private` → `archived`
- `validated_library` → `archived`
- `archived` → aucune transition standard

Le refus sans commentaire est refusé par l'API. Les validations sont séparées en deux routes explicites : validation privée ou validation bibliothèque.

## Rôles

Rôles serveur attendus :

- `creator`
- `responsible`
- `validator`
- `admin`
- `read_only`
- `library_reader`

Les rôles affichés côté frontend ne sont utilisés que pour l'UX. Les décisions d'accès sont contrôlées côté serveur.

## Permissions

Permissions serveur minimales :

- `dl:create`
- `dl:readOwn`
- `dl:readAssigned`
- `dl:readAll`
- `dl:updateDraft`
- `dl:updateAssigned`
- `workflow:assign`
- `workflow:submit`
- `workflow:reject`
- `workflow:validatePrivate`
- `workflow:validateLibrary`
- `workflow:archive`
- `library:read`
- `admin:readAudit`

Le service `server/src/services/permissions-service.js` centralise ces règles.

## Routes API workflow

Toutes les routes nécessitent un token Bearer serveur.

### Assigner une DL

`POST /api/dl/:id/assign`

```json
{
  "assignedToUserId": "user-id",
  "comment": "Attribuée pour rédaction"
}
```

### Soumettre une DL

`POST /api/dl/:id/submit`

```json
{
  "comment": "DL prête pour validation"
}
```

### Refuser une DL

`POST /api/dl/:id/reject`

```json
{
  "comment": "Compléter les objectifs pédagogiques et annexes."
}
```

### Validation privée

`POST /api/dl/:id/validate-private`

```json
{
  "comment": "Validée pour usage interne ciblé."
}
```

### Validation bibliothèque

`POST /api/dl/:id/validate-library`

```json
{
  "comment": "Validée et publiable dans la bibliothèque."
}
```

### Archivage

`POST /api/dl/:id/archive`

```json
{
  "comment": "Ancienne version remplacée."
}
```

### Historique et commentaires

- `GET /api/dl/:id/history`
- `GET /api/dl/:id/comments`

## Verrouillage

Les statuts suivants sont verrouillés en modification directe via `PUT /api/dl/:id` :

- `submitted`
- `validated_private`
- `validated_library`
- `archived`

Une tentative de modification directe d'une DL verrouillée renvoie `423` et crée une entrée `dl.update_blocked_locked_status` dans l'audit log.

## Versioning

La version initiale d'une DL serveur est `1`.

Chaque création et chaque modification autorisée créent une entrée dans `dl_versions` avec le JSON complet. Les modifications autorisées incrémentent le numéro de version.

Règle retenue Phase 3 pour les DL validées : modification directe refusée. La création d'une nouvelle version éditable à partir d'une DL validée est réservée à une phase ultérieure ou à une route dédiée à ajouter proprement.

## Audit trail

Chaque action workflow écrit dans `audit_log` :

- `workflow.assign`
- `workflow.submit`
- `workflow.reject`
- `workflow.validate_private`
- `workflow.validate_library`
- `workflow.archive`
- `dl.version_created`
- `dl.update_blocked_locked_status`

L'audit inclut `user_id`, `entity_type`, `entity_id`, anciennes/nouvelles valeurs, IP, user-agent et date/heure serveur.

## Tables ajoutées / adaptées

- `dl_documents` : ajout de `assigned_to_user_id`, `validator_user_id`, `version`, `published_at`, `archived_at`, `submitted_at`, `validated_at`, `rejected_at`.
- `dl_status_history`
- `dl_comments`
- `dl_versions`

La migration convertit les anciens statuts Phase 2 `server_saved` en `draft` afin de conserver les DL existantes.

## Ce qui reste legacy/local

- Ouverture directe de `index.html`.
- Login legacy local.
- Sauvegarde locale IndexedDB/localStorage.
- Import/export JSON.
- Export PDF existant.
- CSV locaux.

## Non réalisé en Phase 3

- Notifications e-mail.
- Dashboard Admin complet.
- Bibliothèque serveur avancée.
- Compteur de nouveautés au login.
- Reset mot de passe complet.
- Hardening production complet.

## Préparation Phase 4

Le statut `validated_library` permet déjà de distinguer les DL publiables. La Phase 4 pourra ajouter la bibliothèque serveur partagée, la recherche, les compteurs de nouveautés et les règles de diffusion avancées.
