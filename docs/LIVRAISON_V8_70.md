# DL creator web v8.70

## Objet
Version corrective consolidée issue de v8.60-correctif-4.

## Corrections ciblées
- Conservation des modifications manuelles des champs `FORMATEUR` dans le plan horaire.
- Le champ `FORMATEUR DE LA LEÇON` reste une action globale : lorsqu'il est renseigné à nouveau, il remplace volontairement tous les formateurs de ligne.
- Les recherches partielles dans les champs `FORMATEUR` de ligne ne sont plus sauvegardées à la frappe.
- Les valeurs de ligne sont validées à la sélection, à Entrée ou à la sortie du champ avec une valeur complète.
- Version applicative affichée portée à `v8.70` pour identifier clairement cette livraison.

## Non modifié
- Moteur PDF, aperçu A4, pagination, annexes PDF.
- Import/export JSON et ZIP.
- IndexedDB/localStorage.
- Workflow validation et RBAC.
- Offline-first et compatibilité Safari.
