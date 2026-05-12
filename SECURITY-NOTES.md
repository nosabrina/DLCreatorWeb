# Notes sécurité — DL Creator Web v9.04

## Modèle de sécurité actif

La v9.04 reste une application web offline-first exécutée dans le navigateur. Le RBAC local contrôle l’interface et les workflows, mais ne remplace pas une sécurité serveur institutionnelle complète.

## État serveur

- Backend préparé mais désactivé.
- Authentification serveur désactivée.
- Audit serveur désactivé.
- Remote storage désactivé.
- Synchronisation distante désactivée.
- E-mails réels désactivés.

## Secrets

Aucun secret ne doit être présent dans :

- `index.html`
- `app.js`
- `js/`
- `netlify/functions/`
- `server/`
- `.env.example`

Les fichiers `.env` réels sont exclus par `.gitignore`.

## Gestion des accès

La v9.04 ajoute :

- fonction explicite `saveHabilitationsExplicit` ;
- garde-fou contre fonction critique manquante ;
- mécanisme de récupération locale admin ;
- conservation du principe Chef formation = admin structure ;
- audit local des enregistrements et erreurs d’habilitations.

## Stockage

IndexedDB est prioritaire. Si IndexedDB fonctionne, la bibliothèque complète n’est plus consolidée lourdement dans localStorage. localStorage reste réservé aux petites données locales et aux fallback contrôlés.
