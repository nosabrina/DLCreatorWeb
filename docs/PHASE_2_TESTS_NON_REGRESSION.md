# Phase 2 — Checklist tests non-régression

## Mode local obligatoire

- [ ] Ouvrir `index.html` directement sans serveur backend.
- [ ] Le login legacy existant fonctionne comme avant.
- [ ] Création d’une DL locale.
- [ ] Sauvegarde IndexedDB locale.
- [ ] Chargement depuis la bibliothèque locale.
- [ ] Import JSON.
- [ ] Export JSON.
- [ ] Aperçu/export PDF inchangé.
- [ ] Aucun appel serveur obligatoire.
- [ ] Aucune erreur console bloquante liée au backend désactivé.
- [ ] CSV inchangés et chargés comme avant.

## Mode serveur pilote

- [ ] `cd server && npm install`.
- [ ] `.env` créé depuis `.env.example`.
- [ ] `JWT_SECRET` remplacé par une vraie valeur longue.
- [ ] `ADMIN_PASSWORD` remplacé par un vrai mot de passe.
- [ ] `npm run seed:admin` crée l’Admin initial.
- [ ] `npm run dev` démarre le serveur.
- [ ] `GET /api/health` répond `{ ok: true }`.
- [ ] `POST /api/auth/login` retourne un access token.
- [ ] `GET /api/auth/me` fonctionne avec Bearer token.
- [ ] `POST /api/dl` sauvegarde une DL serveur.
- [ ] `GET /api/dl` liste les DL visibles.
- [ ] `GET /api/dl/:id` lit la DL avec son JSON complet.
- [ ] `PUT /api/dl/:id` modifie la DL.
- [ ] `DELETE /api/dl/:id` fait un soft delete.
- [ ] La DL supprimée ne ressort plus dans `GET /api/dl`.
- [ ] `GET /api/admin/audit-log` montre les actions si utilisateur Admin.
- [ ] Un utilisateur non Admin ne peut pas accéder à l’audit log.

## Front serveur optionnel

- [ ] `backendEnabled` reste `false` par défaut.
- [ ] `serverDiagnosticsEnabled` reste `false` par défaut.
- [ ] Après activation volontaire, le panneau diagnostic apparaît.
- [ ] Health fonctionne depuis le panneau.
- [ ] Login serveur fonctionne depuis le panneau.
- [ ] `Me` affiche l’utilisateur serveur courant.
- [ ] Sauvegarde DL serveur fonctionne depuis le panneau.
- [ ] Liste DL serveur fonctionne depuis le panneau.
- [ ] En cas de serveur éteint, l’erreur est affichée sans casser l’application locale.
