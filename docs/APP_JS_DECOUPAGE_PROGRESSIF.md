# Découpage progressif de app.js

## Cartographie actuelle

`app.js` contient actuellement :

1. Constantes et état global `APP`.
2. Helpers DOM, chaînes, dates et normalisation.
3. Configuration métier Bloom, grades, domaines, codes.
4. Parsing CSV, `CSVStore`, `AutocompleteService`.
5. Modèle DL implicite : `defaultDL`, `ensureDLModel`, statuts, référence.
6. Annexes PDF et rendu des pages PDF importées.
7. Plan horaire et synchronisation Fil rouge.
8. Profil, login local, session locale.
9. Bibliothèque IndexedDB.
10. Rendu UI complet.
11. Gestion des onglets, formulaires, événements.
12. Import JSON / export JSON.
13. Import Word.
14. Aperçu PDF / impression / HTML PDF.

## Ordre d’extraction recommandé

1. Modèle DL : extraire progressivement `defaultDL`, `ensureDLModel`, statuts, identifiants.
2. Stockage : faire passer les opérations bibliothèque par `js/dl-storage-api.js`.
3. Bibliothèque : isoler rendu et opérations d’ouverture/import/export/suppression.
4. Auth : déplacer profil/session legacy dans `js/auth-client.js` après tests.
5. Autocomplete CSV : extraire `CSVStore` puis `AutocompleteService`.
6. Import/export JSON : centraliser validation, normalisation et téléchargement.
7. Export PDF : dernière extraction front-end, uniquement avec tests visuels PDF.
8. Workflow futur : soumission, validation, refus, publication bibliothèque.
9. Admin futur : utilisateurs, droits, suivi DL, audit trail.

## Risques

- Régression de l’autosave si l’état `APP.state.current` est manipulé trop tôt.
- Perte de compatibilité JSON si `ensureDLModel` devient destructif.
- Régression PDF si les classes HTML/CSS changent.
- Rupture ouverture locale si passage brutal à ES modules ou build tooling.
- Problèmes de performance si les CSV sont relus à chaque saisie.

## Stratégie de tests après chaque extraction

Après chaque extraction, tester :

- démarrage par double-clic sur `index.html` ;
- login legacy ;
- création et sauvegarde DL ;
- réouverture depuis bibliothèque ;
- import/export JSON ;
- Fil rouge ;
- Plan horaire ;
- autocomplete Personnel / véhicules / matériel / fournitures ;
- aperçu PDF et impression/export PDF ;
- console navigateur sans erreur.
