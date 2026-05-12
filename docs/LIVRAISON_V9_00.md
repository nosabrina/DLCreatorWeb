# Livraison v9.00 — pilote serveur contrôlé

## Objectif

La v9.00 transforme la v8.90 validée en première version pilote Functions diagnostic, sans rendre le serveur obligatoire et sans activer de backend réel.

## Points clés

- Offline-first reste prioritaire.
- Netlify Functions préparées, désactivées fonctionnellement par défaut.
- `diagnostics-ping` est testable en mode non destructif.
- Wrapper API unique renforcé avec timeout, fallback, audit et statut `prepared / disabled / reachable / failed`.
- Supervision pilote enrichie dans le diagnostic production.
- E-mails transactionnels préparés et versionnés, aucun envoi réel.
- Workflow local conservé ; payloads serveur uniquement préparés.
- RBAC local conservé ; diagnostics permissions serveur préparés.
- Backup ZIP préparé ; aucun restore automatique.

## Incidents v8.90 documentés

- `DEFAULT_DL_VERSION` avant initialisation : garde-fou ajouté.
- `tryPersistDraft` manquant : contrôle de référence critique ajouté.

## Non-régression PDF

Aucun changement volontaire du moteur PDF, de l’aperçu A4, de l’impression navigateur ou du rendu des annexes.
