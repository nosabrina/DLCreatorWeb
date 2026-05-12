# Phase 10 — Activation progressive backend

`js/config.js` doit rester avec `backendEnabled: false` dans le ZIP.

| Étape | Action | Test OK | Rollback | Risque |
|---|---|---|---|---|
| 1 | Mode local inchangé | `index.html` s’ouvre sans serveur | Aucun | Régression locale |
| 2 | Démarrer serveur | `npm start` stable | Stop service | Config `.env` |
| 3 | Healthcheck | `/api/health` OK | Stop service | Proxy/API |
| 4 | Login Admin serveur | Connexion Admin OK | Désactiver backend front | Identifiants |
| 5 | Diagnostics serveur | Diagnostics lisibles | Retour local | DB/logs |
| 6 | Sauvegarde DL test | DL test sauvée côté serveur | Supprimer DL test | JSON volumineux |
| 7 | Workflow test | Soumission/validation/refus OK | Retour local | Droits |
| 8 | Bibliothèque serveur | DL validée visible | Désactiver feature | Visibilité |
| 9 | Dashboard Admin | Stats cohérentes | Désactiver feature | Permissions |
| 10 | Notifications dry-run | Log e-mail sans envoi | `MAIL_ENABLED=false` | SMTP |
| 11 | SMTP réel | E-mail Admin reçu | `MAIL_ENABLED=false` | Routage mail |
| 12 | Pilotes limités | Quelques comptes OK | `backendEnabled=false` | Adoption |

Chaque bascule doit être testée avec un petit lot, puis documentée OK/KO avant ouverture plus large.
