# DL creator web v8.60-correctif-3

## Objet
Correction ciblée de l’onglet Validation et de la synchronisation avec le champ STATUT de l’onglet Généralités.

## Fichiers modifiés
- app.js
- js/config/version.js
- docs/LIVRAISON_V8_60_CORRECTIF_3.md

## Cause corrigée
Le statut affiché utilisateur et l’état workflow technique étaient mélangés. Les services workflow pouvaient réécrire le statut affiché avec une valeur technique ou ne pas propager l’action des boutons vers le champ DOM.

## Correction
- Ajout d’un mapping central entre statut utilisateur et état workflow interne.
- Ajout de `applyValidationStatus(...)` comme point de passage unique.
- Correction des boutons : Transmettre en validation, Valider la DL, Refuser / corriger, Archiver.
- Correction du changement manuel de STATUT VALIDATION.
- Synchronisation immédiate de STATUT VALIDATION et STATUT Généralités.
- Sauvegarde immédiate après changement de statut.

## Non modifié
- PDF
- aperçu A4
- html2pdf
- jsPDF
- PDF.js
- pagination
- annexes PDF
- import/export JSON et ZIP
- IndexedDB/localStorage
- mode offline-first
