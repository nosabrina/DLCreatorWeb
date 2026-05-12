# Contrôles exécutés — v10.01

- `node --check app.js` : OK.
- `node --check config/runtime-config.js` : OK.
- `node --check config/feature-flags.js` : OK.
- `node --check config/app-config.js` : OK.
- `node --check js/config/version.js` : OK.
- Contrôle version visible/config : v10.01 dans `index.html`, `app.js`, `VERSION.md`, `CHANGELOG.md`, `config/runtime-config.js`, `config/app-config.js`, `js/config/version.js`.
- Contrôle buildIncrement : 201.
- Contrôle build : `2026.05.12-v10.01-filrouge-images-dragdrop-confirm-4-3-pdf`.
- Contrôle cache busting : `20260512-v10.01-filrouge-images-dragdrop-confirm-4-3-pdf`.
- Contrôle flags v10.01 présents dans `config/feature-flags.js` et `js/config/version.js`.
- Contrôle bouton visible `Ajouter photo` absent du rendu `app.js`.
- Contrôle Drag&Drop visible sans condition d'images.
- Contrôle suppression avec modale `Suppression de la photo`.
- Contrôle CSS PDF : largeur 5 cm, bordure supprimée, galerie centrée.

## Limites de contrôle local

Les flux navigateur réels Safari/Chrome, ajout par fichiers, Drag&Drop, sauvegarde/rechargement, export/import JSON et export PDF doivent être validés côté utilisateur sur `localhost`, car ils nécessitent l'exécution interactive dans le navigateur et des images de test réelles.
