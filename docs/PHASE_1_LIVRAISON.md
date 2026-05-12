# Phase 1 — Livraison

## Fichiers créés

- `js/config.js`
- `js/api-client.js`
- `js/permissions.js`
- `js/auth-client.js`
- `js/dl-model.js`
- `js/dl-storage-api.js`
- `docs/PHASE_1_AUDIT_PREPARATION_BACKEND.md`
- `docs/DL_JSON_SCHEMA_TRANSITOIRE.md`
- `docs/APP_JS_DECOUPAGE_PROGRESSIF.md`
- `docs/PHASE_1_TESTS_NON_REGRESSION.md`
- `docs/PHASE_1_LIVRAISON.md`
- `server/src/routes/library.js`

## Fichiers modifiés

- `index.html` : ajout du chargement des modules Phase 1 avant `app.js`.
- `server/src/server.js` : ajout de la route préparatoire `/api/library`.
- `server/README.md` : documentation du backend pilote optionnel.

## Fichiers volontairement non modifiés

- `app.js`
- `styles.css`
- `data/*.csv`
- `assets/*`
- moteur PDF existant
- logique IndexedDB/localStorage existante
- login legacy existant
- import/export JSON existant

## Ce qui a été fait

- Ajout d’un namespace unique `window.DLCreatorCore`.
- Ajout d’une configuration front-end centralisée avec backend désactivé par défaut.
- Ajout d’un client API prêt pour futures routes, mais inactif par défaut.
- Ajout d’un modèle DL non destructif compatible avec les anciennes DL.
- Ajout d’une façade stockage pouvant lire/écrire dans l’IndexedDB actuelle.
- Ajout d’une façade auth transitoire sans remplacer le login actuel.
- Ajout d’une table rôles/permissions préparatoire explicitement non sécuritaire côté front.
- Ajout de la documentation de migration, schéma JSON transitoire, découpage progressif et tests.
- Ajout d’une route serveur préparatoire `/api/library`.

## Ce qui n’a pas encore été fait

- Aucune authentification serveur réelle.
- Aucun stockage DL serveur réel.
- Aucun workflow serveur réel.
- Aucun envoi e-mail serveur.
- Aucun dashboard admin réel.
- Aucun audit trail réel.
- Aucun remplacement IndexedDB/localStorage.
- Aucune refonte de `app.js`.
- Aucune modification du PDF.

## Contrôle technique réalisé

- Vérification syntaxique Node des nouveaux fichiers JS front-end.
- Vérification syntaxique Node des fichiers serveur modifiés.
- Modification volontairement minimale de `index.html`.
