# Netlify Functions — préparation v8.90

Fonctions préparées mais désactivées par défaut :

- auth-login
- auth-refresh
- users-invite
- workflow-submit
- workflow-validate
- notifications-send
- diagnostics-ping

Principes : réponses JSON homogènes, correlationId, timeout côté client, logs serveur, validation stricte des entrées, fallback local/offline-first. Aucun secret n’est exposé au frontend.
