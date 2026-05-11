# Correctif v8.60 — Généralités, validation et bibliothèque

## Corrections appliquées

- Persistance du champ `VERSION` dans l’onglet Généralités.
- Recalcul immédiat de la `RÉFÉRENCE AUTOMATIQUE` lorsque la version est modifiée.
- Suppression de l’écrasement de la version saisie par l’ancienne version contenue dans une référence déjà calculée.
- Synchronisation du champ `STATUT VALIDATION` avec le champ `STATUT` de l’onglet Généralités lors de `Transmettre en validation`, refus, archivage et validation.
- Sauvegarde immédiate du changement de statut dans la bibliothèque locale.
- Consolidation IndexedDB + miroir localStorage pour mieux préserver la bibliothèque locale lors du remplacement de version sur le même origin navigateur.

## Non modifié volontairement

- Moteur PDF.
- Aperçu A4.
- Pagination.
- Annexes PDF.
- html2pdf / jsPDF / PDF.js.
- Import/export JSON ou ZIP.
- Logique offline-first.

## Limite

La bibliothèque locale reste liée à l’origin navigateur. Si la nouvelle version est servie depuis un autre port, domaine ou chemin isolé par le navigateur, les données locales de l’ancien origin ne peuvent pas être récupérées automatiquement sans export/import ou mécanisme serveur.
