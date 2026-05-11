# Livraison v8.90 — pré-production GitHub/Netlify

## Périmètre

Cette livraison part strictement de la v8.81 et prépare la pré-production GitHub/Netlify sans activer de backend obligatoire et sans modifier la stratégie PDF validée.

## Points réalisés

- Version centralisée v8.90.
- Bannière/version build enrichie via `js/config/version.js` et diagnostic production.
- Préparation Netlify Functions désactivées par défaut.
- Templates e-mails transactionnels versionnés.
- Supervision workflow pilote et transitions contrôlées.
- Backup ZIP préparé avec manifest et restore guidé.
- Procédures release, rollback, backup, Netlify et Git.
- Diagnostics enrichis : fonctions, notifications, workflow supervision, backup ZIP.

## Garanties de non-régression

- Aucun remplacement du moteur PDF.
- Pas de réintroduction html2canvas/jsPDF comme moteur principal.
- Offline-first conservé.
- IndexedDB et fallback local conservés.
- Import/export JSON conservé.
- RBAC actuel conservé et enrichi côté préparation.
- Compatibilité anciennes DL conservée.

## Tests exécutés

- `node scripts/check-js-syntax.js`
- `node scripts/check-critical-files.js`
- `node --check` sur les Netlify Functions

## Contrôles utilisateur attendus

- Export diagnostic v8.90.
- Export audit local.
- Console navigateur.
- Safari et Chrome.
- Localhost et Netlify preview.
- Confirmation workflow, PDF, import/export, rôles et diagnostic.
