# Déploiement Netlify Preview

1. Créer un dépôt GitHub privé.
2. Pousser la v9.10 sans `.env` réel.
3. Créer un site Netlify depuis GitHub.
4. Build command vide, publish directory `.`.
5. Vérifier `netlify.toml`.
6. Définir les variables d’environnement uniquement dans Netlify si nécessaire, en conservant tous les flags backend à `false`.
7. Contrôler le Preview Deploy.

Aucun e-mail, backend, auth serveur ou stockage distant ne doit être activé en v9.10.
