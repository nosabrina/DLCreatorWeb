# Phase 3 — Checklist tests non-régression

## Mode local

- [ ] Ouverture directe de `index.html` sans serveur.
- [ ] Login legacy local fonctionnel.
- [ ] Création DL locale.
- [ ] Sauvegarde locale.
- [ ] Bibliothèque locale IndexedDB fonctionnelle.
- [ ] Import JSON.
- [ ] Export JSON.
- [ ] Export PDF inchangé.
- [ ] Aucune erreur console bloquante.

## Mode serveur Phase 2 conservé

- [ ] `GET /api/health` répond avec `phase: "3"`.
- [ ] Login serveur.
- [ ] `GET /api/auth/me`.
- [ ] Création DL serveur.
- [ ] Liste DL serveur.
- [ ] Lecture DL serveur.
- [ ] Modification DL serveur autorisée sur statut éditable.
- [ ] Suppression soft delete conservée.

## Mode workflow Phase 3

- [ ] Assignation DL : `draft` → `assigned`.
- [ ] Première sauvegarde serveur significative : `assigned` → `in_progress`.
- [ ] Soumission : `in_progress` → `submitted`.
- [ ] Refus sans commentaire = refus API.
- [ ] Refus avec commentaire = OK.
- [ ] Correction après refus : `rejected` → `in_progress`.
- [ ] Validation privée : `submitted` → `validated_private`.
- [ ] Validation bibliothèque : `submitted` → `validated_library`.
- [ ] Archivage d'une DL validée.
- [ ] Modification d'une DL validée bloquée avec HTTP `423`.
- [ ] Historique visible via `GET /api/dl/:id/history`.
- [ ] Commentaires visibles via `GET /api/dl/:id/comments`.
- [ ] `audit_log` alimenté à chaque action workflow.
- [ ] Permissions respectées par rôle.

## Séquence recommandée

1. Login admin.
2. Créer une DL.
3. Assigner la DL à un utilisateur actif.
4. Modifier/sauvegarder côté serveur.
5. Soumettre.
6. Refuser sans commentaire, vérifier le refus API.
7. Refuser avec commentaire.
8. Corriger/sauvegarder.
9. Soumettre à nouveau.
10. Valider privée.
11. Créer une autre DL.
12. Passer jusqu'à `submitted`.
13. Valider bibliothèque.
14. Archiver.
15. Consulter historique et commentaires.
