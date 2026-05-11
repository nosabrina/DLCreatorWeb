# DL creator web v8.60 — Stabilisation collaborative pilote

## Objet
Version de stabilisation issue strictement de v8.50. Elle consolide les validations distribuées, le diagnostic production v3, les conflits préparatoires, le RBAC pilote et corrige le faux positif initial des buts / évaluations.

## Points corrigés
- Les évaluations vides fraîchement créées ne sont plus classées comme incohérences bloquantes.
- Le diagnostic des buts / évaluations distingue désormais : hydratation stable, incohérences bloquantes, avertissements non bloquants et état des champs renseignés.
- Le diagnostic production exporté contient l’état `objectives` et `coherence`.
- Les transitions workflow distribuées produisent des messages plus explicites et journalisent les verrous validation / publication.
- Les refus motivés et blocages publication vérifient les permissions RBAC avec contexte document.
- Les conflits préparatoires utilisent un verrou optimiste plus explicite et journalisent l’absence de corruption JSON.

## Non modifié volontairement
- Moteur PDF / html2pdf / jsPDF / PDF.js.
- Aperçu A4, pagination, annexes PDF, impression / export PDF.
- Import / export JSON et ZIP.
- IndexedDB, localStorage et fonctionnement offline-first.
- Synchronisation distante : toujours désactivée par défaut.

## Compatibilité
- Anciennes DL conservées et normalisées à l’ouverture.
- Safari et serveur local `python3 -m http.server` conservés.
- Clés locales utilisateurs v8.50 conservées pour éviter toute perte des comptes pilotes déjà créés.
