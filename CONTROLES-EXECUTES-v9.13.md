# Contrôles exécutés — v9.13

- `node --check app.js` : OK.
- `node --check config/runtime-config.js` : OK.
- `node --check config/app-config.js` : OK.
- `node --check config/feature-flags.js` : OK.
- `node --check js/config/version.js` : OK.
- Versioning : v9.13, buildIncrement 113, build `2026.05.12-v9.13-filrouge-icons-alignment`.
- Cache busting : chaînes `v9.13-filrouge-icons-alignment` mises à jour dans `index.html`.
- Icône Fil rouge monter : `data-sf-symbol="arrow.up.document.fill"` présent.
- Icône Fil rouge descendre : `data-sf-symbol="arrow.down.document.fill"` présent.
- Alignement poubelle : classe dédiée `filrouge-trash-cell` présente.
- Moteur PDF : non modifié.

## À confirmer côté utilisateur

Les contrôles Safari/Chrome réels, l’alignement visuel exact dans l’interface, les exports diagnostic/audit v9.13 et la non-régression PDF doivent être confirmés sur l’environnement local.
