# DL creator web v8.60-correctif-4

## Objet
Correction ciblée de l’onglet **Plan horaire** : synchronisation fiable du champ **FORMATEUR DE LA LEÇON** vers tous les champs **FORMATEUR** du planning horaire.

## Cause corrigée
La saisie temporaire dans l’autocomplétion du formateur global pouvait être persistée et propagée dès l’événement `input`. Une simple lettre de recherche pouvait donc se retrouver dans les lignes du plan horaire. De plus, la propagation existante ne complétait que les lignes vides, ce qui empêchait le remplacement complet lors d’un changement ultérieur de formateur.

## Corrections appliquées
- Ajout d’une normalisation centralisée du nom formateur.
- Ajout d’une fonction centrale `applyLessonTrainerToSchedule(...)`.
- Propagation uniquement après sélection, validation ou sortie de champ avec une valeur exploitable.
- Remplacement de tous les champs `FORMATEUR` du plan horaire par le formateur global sélectionné.
- Mise à jour simultanée de l’état mémoire et des champs visibles.
- Diagnostic non bloquant si une incohérence formateur est détectée.

## Non modifié
- PDF
- aperçu A4
- pagination
- annexes PDF
- html2pdf
- jsPDF
- PDF.js
- import/export JSON
- import/export ZIP
- IndexedDB/localStorage
- workflow validation
- RBAC
- anciennes DL
- offline-first
