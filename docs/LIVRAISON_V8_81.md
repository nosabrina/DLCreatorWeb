# Livraison DL creator web v8.81

## Périmètre
Correctif strict à partir de v8.80, limité au versionning métier des DL et à la réduction du bruit audit/migration.

## Corrections
- Version par défaut des nouvelles DL : `v1.00`.
- Validation stricte du champ VERSION : `v1.00`, `v1.01`, `v8.11`, etc.
- Rejet UX des formats invalides : `v1`, `1.00`, `v1.0`, `v1.000`, `v01.00`, etc.
- Conservation de la saisie pendant l’édition ; normalisation uniquement si format complet valide.
- Audit local : anti-duplication des événements de sauvegarde répétés.
- Migration-service : séparation claire entre journal migration et journal stockage.

## Non modifié
- html2pdf, jsPDF, PDF.js.
- Aperçu A4, pagination, annexes PDF, rendu impression/export PDF.
- Import/export JSON et ZIP.
- IndexedDB, localStorage, offline-first et compatibilité anciennes DL.

## Contrôles
- Syntaxe JavaScript contrôlée avec `node --check`.
- Vérification des références version v8.81.
- Contrôle ZIP final.
