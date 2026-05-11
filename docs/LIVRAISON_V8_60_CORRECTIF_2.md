# DL creator web v8.60-correctif-2

## Objet
Correction ciblée de la synchronisation du statut entre l’onglet Validation et l’onglet Généralités.

## Corrections
- Le bouton « Transmettre en validation » force désormais le statut métier à « En validation ».
- Le champ « Statut validation » est mis à jour immédiatement dans l’onglet Validation.
- Le champ « STATUT » de l’onglet Généralités est calculé, non éditable, et aligné sur le statut de validation.
- Le champ « STATUT » reprend le style visuel des champs calculés comme « RÉFÉRENCE AUTOMATIQUE ».
- La sauvegarde locale est déclenchée immédiatement après transition de statut.

## Non modifié
- Moteur PDF.
- Aperçu A4.
- Pagination.
- Annexes PDF.
- Import/export JSON et ZIP.
- IndexedDB/localStorage.
- Architecture offline-first.
