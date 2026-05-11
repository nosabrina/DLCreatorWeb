# Phase 4 — Checklist tests non-régression

## Mode local

- [ ] Ouverture directe de `index.html` sans serveur.
- [ ] Login legacy local fonctionnel.
- [ ] Création d'une DL locale.
- [ ] Sauvegarde locale IndexedDB/localStorage.
- [ ] Bibliothèque IndexedDB locale consultable.
- [ ] Import JSON fonctionnel.
- [ ] Export JSON fonctionnel.
- [ ] Export PDF inchangé.
- [ ] Aucun serveur requis.
- [ ] Aucune erreur console bloquante liée à `library-server.js` lorsque le backend est désactivé.

## Backend Phase 2

- [ ] `GET /api/health` répond.
- [ ] Login serveur fonctionnel.
- [ ] `GET /api/auth/me` fonctionnel.
- [ ] CRUD DL serveur conservé.

## Workflow Phase 3

- [ ] Assignation.
- [ ] Soumission.
- [ ] Refus avec commentaire obligatoire.
- [ ] Validation privée.
- [ ] Validation bibliothèque.
- [ ] Archivage.
- [ ] Historique workflow.

## Bibliothèque Phase 4

- [ ] Une DL `validated_private` est absente de `/api/library`.
- [ ] Une DL `validated_library` est présente dans `/api/library`.
- [ ] La liste ne renvoie pas `json_data` complet.
- [ ] `GET /api/library/:id` renvoie le détail complet.
- [ ] Filtre domaine.
- [ ] Filtre thème.
- [ ] Filtre public cible.
- [ ] Filtre titre.
- [ ] Recherche texte libre `q`.
- [ ] Pagination `limit` / `offset`.
- [ ] Compteur nouveautés avec `GET /api/library/stats/new-count`.
- [ ] Marquage comme vue avec `POST /api/library/:id/mark-viewed`.
- [ ] Le compteur diminue après marquage comme vue.
- [ ] Archivage masque la DL par défaut.
- [ ] Admin peut consulter les archives avec `includeArchived=true` si la DL reste au statut bibliothèque et visible selon règle serveur.
- [ ] Audit log alimenté pour list/search/view/mark_viewed/published/hidden_archived.
- [ ] `library_events` alimenté.
