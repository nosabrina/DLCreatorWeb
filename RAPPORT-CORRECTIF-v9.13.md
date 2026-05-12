# Rapport correctif — DL Creator Web v9.13

## Justification du versioning

La version v9.13 est un correctif mineur ciblé : elle modifie uniquement l’interface du module Fil rouge, sans changement d’architecture, de stockage, de RBAC, de workflow, d’import/export JSON ou de moteur PDF.

- Version : v9.13
- Build increment : 113
- Build : `2026.05.12-v9.13-filrouge-icons-alignment`

## Rapport UI Fil rouge

### Icônes de réorganisation

Les icônes des boutons de réorganisation des sections ont été remplacées par des SVG locaux portant les attributs suivants :

- `data-sf-symbol="arrow.up.document.fill"` pour monter une section ;
- `data-sf-symbol="arrow.down.document.fill"` pour descendre une section.

Aucune dépendance externe n’a été ajoutée. La logique existante `moveFilRougeSection(index, direction)` est conservée.

### Couleur RAL3000

Les boutons de réorganisation et la poubelle conservent la couleur institutionnelle via `var(--sdis-red)`.

### Alignement poubelle

La cellule de suppression Fil rouge utilise maintenant une classe dédiée `filrouge-trash-cell` afin d’aligner la poubelle avec la ligne du champ de saisie `TITRE SECTION`.

## Zones non modifiées

- moteur PDF ;
- aperçu A4 ;
- impression ;
- pagination ;
- import/export JSON ;
- IndexedDB ;
- localStorage ;
- RBAC ;
- workflows de validation ;
- Gestion des accès ;
- Bibliothèque DL ;
- Netlify Functions ;
- backend ;
- e-mails serveur.
