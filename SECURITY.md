# Sécurité — DL Creator Web v9.10

## Principe

La v9.10 est publiable sur GitHub privé uniquement avec secrets externalisés. Le frontend ne doit contenir aucun JWT secret, token fournisseur, clé API, mot de passe, NIP de test réaliste ou hash sensible.

## Secrets

Les secrets réels doivent être placés dans les variables d’environnement Netlify ou dans un fichier `.env` local non commité. `.env.example` contient uniquement des placeholders.

## Modes désactivés par défaut

- `NETLIFY_AUTH_ENABLED=false`
- `DL_BACKEND_ENABLED=false`
- `DL_REMOTE_STORAGE_ENABLED=false`
- `DL_SERVER_AUDIT_ENABLED=false`
- `DL_TRANSACTIONAL_MAIL_ENABLED=false`

## Contrôle avant push

1. Vérifier `git status`.
2. Vérifier qu’aucun `.env` réel n’est suivi.
3. Exécuter le contrôle syntaxe JS.
4. Lancer l’application en localhost.
5. Exporter diagnostic production et audit local.
