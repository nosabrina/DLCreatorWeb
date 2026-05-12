# Changelog

## v9.12 — 2026-05-12

Correctif fonctionnel ciblé — build 2026.05.12-v9.12-library-import-safari-session-access-mail-filrouge-ui, buildIncrement 112.

### Corrigé
- Bibliothèque DL : ajout d’un bouton Importer JSON réutilisant la logique de parsing/import JSON existante et persistant la DL dans la bibliothèque locale.
- Safari / reprise de session : le garde-fou boot ne remplace plus l’interface par un écran Démarrage interrompu pour les incidents runtime survenant après le chargement de app.js. Les vraies erreurs de démarrage restent bloquantes.
- Gestion des accès : préparation locale/offline de l’e-mail d’accès fiabilisée, auditée et sans activation d’un backend ou d’un envoi serveur réel.
- E-mail d’accès : titres importants en gras dans la prévisualisation HTML, avec conservation du corps texte propre pour mailto/copier-coller.
- Fil rouge : bouton Ajouter une section placé sous la dernière section, avec + rouge RAL3000 et texte en gras.
- Fil rouge : icônes de réorganisation et poubelle en rouge RAL3000, alignement vertical de la suppression.

### Non modifié
- Moteur PDF, aperçu A4, pagination, impression, IndexedDB, RBAC, workflows de validation, import/export JSON existant hors ajout Bibliothèque DL, backend et Netlify Functions.

## v9.10 — 2026-05-11

- Externalisation de la configuration runtime publique.
- Ajout de `.env.example` sans secret réel.
- Renforcement GitHub privé et Netlify Preview.
- Ajout des flags de sécurité v9.10.
- Backend, e-mails, auth serveur et stockage distant maintenus désactivés.
- Moteur PDF non modifié.

## v9.04

- Préparation GitHub/Netlify initiale et correction `saveHabilitationsExplicit`.
