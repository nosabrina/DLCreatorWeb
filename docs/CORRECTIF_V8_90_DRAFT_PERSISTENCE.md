# Correctif v8.90 — persistance brouillon et champ version

## Problème corrigé
Lors de la modification du champ `version` puis de la sortie du champ par tabulation, `app.js` appelait `tryPersistDraft()` alors que cette fonction n’existait pas dans le périmètre chargé.

Erreur observée :
`ReferenceError: Can't find variable: tryPersistDraft`

## Correction
- Ajout d’une fonction `tryPersistDraft()` non bloquante.
- La persistance du brouillon est encapsulée dans des `try/catch`.
- En cas d’échec localStorage, l’application ne bloque plus le démarrage ni la saisie.
- Cache-busting des scripts mis à jour pour éviter que Safari recharge une ancienne version de `app.js`.

## Non-régression
Aucun changement apporté au moteur PDF, à l’aperçu A4, à l’impression navigateur, à IndexedDB, au workflow ou à RBAC.
