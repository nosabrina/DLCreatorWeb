# DL Creator Web

Application web institutionnelle offline-first pour la production et la gestion locale de descentes de leçon SDIS.

## État v9.10

- Dépôt GitHub privé prêt.
- Netlify Preview préparé.
- Backend, stockage distant, auth serveur, audit serveur et e-mails transactionnels désactivés par défaut.
- Configuration publique centralisée dans `config/`.
- Secrets réels interdits dans le frontend et dans le dépôt.

## Démarrage local

```bash
python3 -m http.server 8080
```

Ouvrir ensuite `http://localhost:8080` dans Safari ou Chrome.

## Configuration

- `.env.example` documente les variables attendues pour Netlify/futur backend.
- `.env` réel ne doit jamais être commité.
- `config/runtime-config.js`, `config/app-config.js` et `config/feature-flags.js` ne contiennent que des valeurs publiques.

## Limites volontaires v9.10

- Pas de backend réel activé.
- Pas d’e-mail réel.
- Pas de synchronisation distante.
- Pas de modification du moteur PDF.
