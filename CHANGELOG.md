# Changelog

## v9.13 — 2026-05-12

Correctif UI ciblé — build `2026.05.12-v9.13-filrouge-icons-alignment`, buildIncrement 113.

### Corrigé
- Fil rouge : remplacement des flèches monter/descendre par des icônes SVG locales déclarées avec `data-sf-symbol="arrow.up.document.fill"` et `data-sf-symbol="arrow.down.document.fill"`.
- Fil rouge : conservation de la couleur rouge RAL3000 pour les actions de réorganisation et de suppression.
- Fil rouge : alignement vertical de la poubelle avec le champ de saisie `TITRE SECTION`.

### Non modifié
- Moteur PDF, aperçu A4, pagination, impression, import/export JSON, IndexedDB, localStorage, RBAC, workflows de validation, Gestion des accès, Bibliothèque DL, backend, e-mails serveur et Netlify Functions.

## v9.12 — 2026-05-12

- Import JSON direct depuis Bibliothèque DL.
- Garde-fou Safari / reprise de session inactive après chargement applicatif.
- Préparation locale/offline de l’e-mail d’accès sans envoi serveur réel.
- Titres de l’e-mail d’accès en gras dans la prévisualisation HTML.
- Bouton Ajouter une section sous la dernière section du Fil rouge.
- Icônes Fil rouge en rouge RAL3000.

## v9.10 — 2026-05-11

- Externalisation de la configuration runtime publique.
- Ajout de `.env.example` sans secret réel.
- Renforcement GitHub privé et Netlify Preview.
- Ajout des flags de sécurité v9.10.
- Backend, e-mails, auth serveur et stockage distant maintenus désactivés.
- Moteur PDF non modifié.
