# DL creator web v8.71

Correctif ciblé Plan horaire — formateurs manuels.

## Correction
- Les champs `FORMATEUR` modifiés manuellement dans le Plan horaire sont maintenant persistés dès la saisie.
- Les valeurs manuelles ne sont plus écrasées lors d’un re-render, d’un changement d’onglet ou d’une synchronisation Fil rouge.
- Une nouvelle sélection volontaire du champ `FORMATEUR DE LA LEÇON` continue de remplacer toutes les lignes, conformément au comportement demandé.

## Non modifié
- PDF, aperçu A4, pagination, annexes PDF.
- Import/export JSON et ZIP.
- IndexedDB/localStorage.
- Workflow Validation / RBAC.
- Offline-first / Safari.
