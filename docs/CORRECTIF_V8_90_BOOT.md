# Correctif v8.90 — démarrage application

## Problème corrigé
Au chargement de la v8.90, la page pouvait rester bloquée sur l’écran de chargement.

Cause : `APP.VERSION` appelait `normalizeVersionValue()` avant l’initialisation de la constante `DEFAULT_DL_VERSION`, ce qui déclenchait une erreur de type `ReferenceError` au chargement de `app.js`.

## Correction appliquée
- Initialisation de `APP.VERSION` rendue indépendante des fonctions déclarées plus bas dans le fichier.
- Ajout d’un garde-fou de démarrage dans `index.html` pour afficher une erreur lisible si une erreur JavaScript bloque l’application avant `init()`.
- Aucun changement PDF, A4, impression, IndexedDB, import/export ou workflow.

## Contrôles
- `node scripts/check-js-syntax.js`
- `node scripts/check-critical-files.js`
- `node --check app.js`
- simulation de chargement séquentiel des scripts déclarés dans `index.html`
