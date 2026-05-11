# Phase 8 — Activation progressive du mode serveur

## Principe

Le mode local reste le mode par défaut. `index.html` doit continuer à s'ouvrir directement, sans serveur, avec IndexedDB/localStorage, login legacy, import/export JSON et export PDF.

Le backend ne doit être activé que progressivement dans `js/config.js`.

## Valeurs sûres par défaut

```js
backendEnabled: false
serverDiagnosticsEnabled: false
securityDiagnosticsEnabled: false
featureFlags: {
  authServerEnabled: false,
  dlServerStorageEnabled: false,
  workflowServerEnabled: false,
  libraryServerEnabled: false,
  adminDashboardEnabled: false,
  notificationsEnabled: false,
  emailDiagnosticsEnabled: false,
  reminderDiagnosticsEnabled: false
}
```

## Ordre recommandé

1. Activer uniquement `backendEnabled` et vérifier `/api/health`.
2. Activer `serverDiagnosticsEnabled` pour les tests contrôlés.
3. Activer `authServerEnabled` et tester le login serveur avec Admin.
4. Activer `dlServerStorageEnabled` et créer une DL de test.
5. Activer `workflowServerEnabled` et tester assignation, soumission, refus, validation privée.
6. Activer `libraryServerEnabled` et tester une validation bibliothèque.
7. Activer `adminDashboardEnabled` et contrôler le résumé Admin.
8. Activer `notificationsEnabled` uniquement en dry-run tant que le SMTP réel n'est pas validé.

## Retour immédiat au mode local

Remettre `backendEnabled: false`, désactiver les diagnostics et tous les feature flags serveur. Le navigateur doit alors revenir au comportement local sans appel obligatoire au backend.

## Tests après chaque activation

- Recharger l'application.
- Vérifier la console navigateur.
- Vérifier qu'une DL locale existante s'ouvre toujours.
- Créer une DL de test.
- Exporter/importer un JSON.
- Contrôler qu'aucune erreur serveur ne bloque le mode local.

## Risques à surveiller

- Mauvais `apiBaseUrl`.
- CORS non aligné avec l'URL de pré-production.
- Compte Admin non seedé.
- Mot de passe Admin faible ou oublié.
- SMTP activé trop tôt.
- Confusion entre données locales IndexedDB et données serveur.
