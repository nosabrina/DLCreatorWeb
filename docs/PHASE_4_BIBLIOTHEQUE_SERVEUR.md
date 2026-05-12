# Phase 4 — Bibliothèque DL partagée serveur

## Objectif

La Phase 4 ajoute une bibliothèque DL partagée côté serveur, sans remplacer la bibliothèque locale IndexedDB. Le mode local/offline-first reste le comportement sûr par défaut lorsque le backend est désactivé.

La bibliothèque serveur exploite uniquement les DL au statut `validated_library`. Une DL validée en privé (`validated_private`) ne doit pas être publiée.

## Fonctionnement bibliothèque

Une DL devient visible dans la bibliothèque serveur lorsque le workflow Phase 3 la fait passer à `validated_library`.

Lors de cette transition, le serveur renseigne :

- `published_at` si nécessaire ;
- `published_by_user_id` ;
- `library_visible = 1` ;
- un audit `library.published` ;
- un événement `library.published` dans `library_events`.

Lorsqu'une DL bibliothèque est archivée, `library_visible` est remis à `0` et elle disparaît des listes par défaut.

## Droits d'accès

La lecture bibliothèque est contrôlée côté serveur via la permission `library:read` ou le droit global `dl:readAll`.

Rôles prévus :

- `library_reader` : lecture bibliothèque uniquement ;
- `read_only` : lecture serveur selon permissions, incluant la bibliothèque ;
- `creator` : conserve ses droits de création ;
- `responsible` : lecture bibliothèque ;
- `validator` : lecture bibliothèque + workflow ;
- `admin` : accès complet, y compris archives avec filtre explicite.

Aucune modification de DL depuis la bibliothèque n'est ajoutée en Phase 4.

## Endpoints

### `GET /api/library`

Liste les DL publiées en bibliothèque, sans renvoyer `json_data`.

Filtres disponibles :

- `domain` ;
- `theme` ;
- `subtheme` ;
- `publicTarget` ;
- `title` ;
- `author` ;
- `version` ;
- `validatedFrom` / `validatedTo` ;
- `publishedFrom` / `publishedTo` ;
- `q` pour la recherche texte libre ;
- `includeArchived=true` réservé utilement à l'admin ;
- `limit` / `offset`.

Tri par défaut : publication décroissante.

Exemple :

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/library?domain=FOBA&theme=ARI&q=ventilation&publicTarget=Officiers"
```

### `GET /api/library/:id`

Renvoie le détail complet d'une DL bibliothèque, y compris `jsonData`.

### `GET /api/library/stats/new-count`

Retourne le nombre de DL bibliothèque jamais vues par l'utilisateur connecté.

### `POST /api/library/:id/mark-viewed`

Marque une DL bibliothèque comme vue par l'utilisateur connecté.

### `GET /api/library/filters/options`

Retourne les valeurs de filtres disponibles dans la bibliothèque active.

## Compteur nouveautés

La table `user_library_views` mémorise les consultations par utilisateur et par DL :

- `first_viewed_at` ;
- `last_viewed_at`.

Le compteur Phase 4 considère comme nouvelles les DL `validated_library`, visibles, non archivées, jamais vues par l'utilisateur.

Le front-end préparatoire expose :

```js
DLCreatorCore.LibraryServer.getNewLibraryCount()
DLCreatorCore.LibraryServer.formatLibraryNotice(count)
```

Message préparé :

> X DL ont été ajoutées à la bibliothèque depuis votre dernière connexion.

Ce message ne doit pas s'afficher en mode local legacy.

## Lien avec le workflow Phase 3

La publication est déclenchée uniquement par la transition serveur `validated_library`. La Phase 4 ne crée pas de publication indépendante hors validation.

`validated_private` reste absent de la bibliothèque partagée.

`archived` masque la DL par défaut.

## Audit trail

Actions journalisées :

- `library.list` ;
- `library.search` ;
- `library.view` ;
- `library.mark_viewed` ;
- `library.published` ;
- `library.hidden_archived` ;
- `library.access_denied`.

Les logs incluent l'utilisateur, la DL si applicable, les filtres de recherche si applicable, l'adresse IP, le user-agent et l'heure.

La table `library_events` complète `audit_log` avec des événements métier bibliothèque.

## Ce qui reste legacy/local

- Bibliothèque locale IndexedDB ;
- login legacy local ;
- import/export JSON local ;
- moteur PDF ;
- CSV locaux ;
- ouverture directe de `index.html`.

## Non fait en Phase 4

- notifications e-mail ;
- dashboard Admin complet ;
- UI bibliothèque serveur complète ;
- gestion fine des groupes/organisations ;
- notifications push ;
- message login avancé totalement intégré à l'écran existant.

## Préparation Phase 5

La Phase 5 pourra ajouter un dashboard Admin complet s'appuyant sur :

- les endpoints bibliothèque ;
- `audit_log` ;
- `library_events` ;
- les statuts workflow ;
- les compteurs de publication/consultation.
