# DL Creator Web v8.50 — pilote comptes et workflows collaboratifs

## Objectif

La v8.50 ajoute une couche pilote locale pour les comptes utilisateurs, workflows collaboratifs, RBAC avancé, audit enrichi, notifications préparatoires, ownership documentaire et Netlify Functions mockées.

## Principes conservés

- Offline-first strict.
- Stockage local navigateur prioritaire.
- Synchronisation distante désactivée par défaut.
- Backend non obligatoire.
- Moteur PDF verrouillé : aucune modification html2pdf, jsPDF ou PDF.js.
- Compatibilité anciennes DL v8.xx préservée par enrichissement non destructif des métadonnées.

## Stratégie comptes pilotes

Les comptes pilotes sont stockés localement via `js/services/users/user-service.js`. Le service prépare les champs utiles au futur backend : JWT, refresh token, MFA, historique de connexion, verrouillage de session et sessions concurrentes.

## Stratégie workflow

Le workflow local utilise les états : brouillon, en rédaction, en validation, corrections demandées, validé, publié, archivé. Les transitions sont tracées dans l'audit local et préparées pour validation serveur future.

## Stratégie collaborative

Chaque DL est enrichie avec ownership, checksum, version workflow, lock édition préparatoire, stratégie de merge manuelle et metadata sync. Ces champs sont non destructifs et restent compatibles avec les imports historiques.

## Limites v8.50

- Pas de synchronisation cloud complète.
- Pas de temps réel.
- Pas de backend obligatoire.
- Netlify Functions en mode mock/preparatoire.
- Les e-mails transactionnels restent préparatoires.

## Validation recommandée

Exporter le diagnostic production et l'audit local après tests Safari/Chrome. Les retours doivent préciser : navigateur, contexte d'exécution, console, diagnostic et audit local.
