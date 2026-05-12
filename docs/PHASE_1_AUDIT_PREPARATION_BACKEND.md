# Phase 1 — Audit et préparation backend

## État actuel du ZIP

Application web locale offline-first composée principalement de :

- `index.html` : point d’entrée minimal, charge `styles.css`, initialise `window.DL_CREATOR_BOOT`, puis charge `app.js`.
- `app.js` : fichier monolithique principal. Il contient la configuration métier, les modèles implicites, le login local, l’état applicatif global, les stores CSV, l’autocomplete, la bibliothèque IndexedDB, l’import/export JSON, l’import Word, les annexes PDF, le rendu UI et le moteur PDF.
- `styles.css` : styles écran, composants, aperçu PDF et règles print.
- `data/*.csv` : catalogues locaux chargés au démarrage (`PersonnelSDIS.csv`, `ListeVehiculeSDIS.csv`, `Materiel.csv`, `Fournitures.csv`).
- `assets/*` : logos et pyramide Bloom.
- `server/` : amorce backend déjà présente, non obligatoire pour le front actuel.

## Stockage actuel

### IndexedDB

La bibliothèque locale utilise IndexedDB :

- base : `DL_CREATOR_WEB_DB_V1`
- store : `library`
- clé : `id`

La logique actuelle est contenue dans `LibraryStore` dans `app.js`, avec :

- ouverture IndexedDB ;
- lecture complète de la bibliothèque ;
- remplacement complet de la bibliothèque ;
- migration legacy depuis `localStorage` si nécessaire.

### localStorage

Clés observées :

- `DL_CREATOR_WEB_LIBRARY_V1` : ancienne bibliothèque locale legacy, migrée vers IndexedDB si présente ;
- `DL_CREATOR_WEB_PROFILE_V1` : profil local ;
- `DL_CREATOR_WEB_SESSION_V1` : session locale ;
- `DL_CREATOR_WEB_DRAFT_V1` : brouillon local.

## Login actuel

Le login reste local et legacy. Le profil, le hash et la session sont gérés côté navigateur dans `app.js`. Ce mécanisme est acceptable uniquement comme transition locale, mais il ne doit pas être présenté comme une sécurité multi-utilisateurs.

## Bibliothèque actuelle

La bibliothèque est locale au navigateur/poste. Elle permet l’ouverture, l’import comme nouvelle DL, l’export JSON, l’export PDF, l’archivage et la suppression. La source réelle reste IndexedDB.

## Import/export JSON

L’export JSON sauvegarde la DL courante ou une DL de la bibliothèque en conservant la structure complète. L’import JSON remplace la DL courante après `JSON.parse`, normalisation via `ensureDLModel`, synchronisation du plan horaire et recalcul de référence.

Règle critique : ne jamais supprimer les champs inconnus lors des futures migrations.

## Export PDF

Le PDF est généré depuis `app.js` avec un aperçu iframe et une logique HTML/CSS print. Les annexes PDF sont préparées avant rendu. Cette zone est sensible et n’a pas été modifiée en Phase 1.

## Dépendances externes éventuelles

Le ZIP contient une application essentiellement autonome. Les dépendances navigateur utilisées sont :

- IndexedDB ;
- localStorage ;
- FileReader ;
- DOM APIs ;
- iframe/print ;
- éventuellement PDF.js chargé dynamiquement selon la logique existante de `app.js`.

## Points de couplage dangereux

- `APP` global centralise état, constantes et configuration.
- `app.js` mélange UI, modèle, stockage, PDF, import Word, CSV et auth.
- `ensureDLModel`, `defaultDL`, `LibraryStore`, `saveCurrent`, `importJsonFile`, `exportPdf` sont critiques.
- La synchronisation Fil rouge → Plan horaire est couplée à plusieurs fonctions globales.
- Le rendu PDF dépend fortement des classes CSS existantes.

## Zones à ne surtout pas toucher sans phase dédiée

1. Moteur PDF et CSS print.
2. Autosave et gestion du brouillon.
3. Bibliothèque IndexedDB existante.
4. Import/export JSON.
5. Autocomplete CSV.
6. Éditeur Fil rouge et Range/Selection API.
7. Chargement direct de `index.html` sans serveur.

## Stratégie Phase 1 appliquée

Phase 1 ajoute uniquement des couches préparatoires chargées avant `app.js` :

- `js/config.js` : configuration centralisée, backend désactivé par défaut ;
- `js/api-client.js` : client API désactivé par défaut ;
- `js/permissions.js` : rôles et permissions front-end préparatoires ;
- `js/auth-client.js` : façade auth legacy/serveur sans remplacer le login actuel ;
- `js/dl-model.js` : modèle DL non destructif ;
- `js/dl-storage-api.js` : façade stockage compatible IndexedDB actuelle.

Ces fichiers exposent `window.DLCreatorCore` et ne modifient pas le comportement métier actuel.

## Ordre recommandé des extractions futures

1. Stabiliser le modèle DL partagé.
2. Brancher progressivement les sauvegardes sur `dl-storage-api`.
3. Extraire la bibliothèque locale.
4. Extraire l’auth legacy.
5. Extraire CSVStore et AutocompleteService.
6. Encapsuler import/export JSON.
7. Encapsuler PDF uniquement après tests dédiés.
8. Ajouter workflow serveur.
9. Ajouter dashboard admin.
