# Architecture v9.10

L’application reste une SPA statique offline-first. Les données métier restent locales via IndexedDB/localStorage selon les mécanismes existants. Les Netlify Functions sont présentes comme préparation, mais désactivées fonctionnellement.

## Séparation

- `index.html`, `app.js`, `styles.css` : frontend applicatif.
- `config/` : configuration runtime publique.
- `netlify/functions/` : fonctions futures préparées.
- `docs/` : documentation projet.
