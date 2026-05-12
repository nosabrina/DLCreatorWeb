# Rapport correctif — DL Creator Web v10.04

## Justification du passage v10.04

Correctif mineur ciblé à partir de v10.03 : aucune évolution majeure d’architecture, de RBAC, de backend, de Netlify Functions, d’e-mails ou de synchronisation distante. Le passage v10.04 est justifié par trois corrections production isolées : réorganisation des photos Fil rouge, rendu PDF PUBLIC CIBLE 10 pt, conservation du statut de validation à l’import JSON.

## Réorganisation images Fil rouge

- Ajout de boutons par photo : flèche gauche et flèche droite.
- Première photo non déplaçable vers la gauche ; dernière photo non déplaçable vers la droite.
- Ajout d’un Drag&Drop horizontal local entre cartes de la même section.
- Déplacement de l’objet image complet : la légende reste liée à la bonne photo.
- L’ordre est celui du tableau `section.images[]`, donc conservé en sauvegarde, rechargement, export JSON, import JSON et export PDF.
- Audit local : `filRougeImageReordered` avec `sectionIndex`, `oldIndex`, `newIndex` et mode Drag&Drop si applicable.

## PDF PUBLIC CIBLE 10 pt

- Classe active v10.04 dédiée : `pdf-public-cible-v1004`.
- Rendu imposé : noir, bold, 10 pt.
- Casse utilisateur respectée.
- Portée limitée au contenu du champ PUBLIC CIBLE sur la première page et dans GÉNÉRALITÉS.

## Conservation statut validation import/export

- Snapshot du statut métier avant normalisation d’import.
- Restauration après `ensureDLModel()` pour éviter toute rétrogradation liée au profil importateur.
- Une DL validée reste validée après import, avec date, validateur, rôle/fonction si présents.
- Le rendu de l’onglet Validation ne rétrograde plus automatiquement une DL validée si l’utilisateur courant n’a pas le droit de valider.
- Les droits de l’utilisateur importateur continuent à limiter les actions futures.
- Audit local : `dlValidationStatusPreservedOnImport` sans journaliser une nouvelle validation locale.

## Compatibilité JSON

- Aucune rupture de schéma.
- Anciennes DL sans statut complet restent importables.
- Images Fil rouge conservées dans `filRouge[].images[]`.
- L’ordre des images repose uniquement sur l’ordre du tableau JSON.

## Audit local

- `filRougeImageReordered` uniquement si l’ordre change réellement.
- `dlValidationStatusPreservedOnImport` uniquement si une DL importée porte déjà le statut `Validé`.
