# Déploiement Netlify gratuit + GitHub — DL Creator Web

## Objectif

Déployer DL Creator Web comme application statique offline-first sur Netlify gratuit, avec le code source versionné dans GitHub, sans perte des données utilisateur lors des mises à jour.

## Principe de persistance

Les données métier restent stockées dans le navigateur de chaque poste, via IndexedDB et localStorage. Une mise à jour GitHub → Netlify remplace les fichiers applicatifs, mais ne vide pas automatiquement les données navigateur tant que :

- le domaine Netlify reste identique ;
- l'utilisateur ne vide pas les données du site ;
- les clés de stockage applicatives ne sont pas renommées ;
- le navigateur/profil utilisateur reste le même.

Avant toute mise à jour importante, exporter les DL en JSON depuis l'application.

## Fichiers publiés sur Netlify

Netlify doit publier la racine du projet, mais `.netlifyignore` exclut les éléments non nécessaires au statique :

- `server/` ;
- `docs/` ;
- fichiers `.env` ;
- bases SQLite ;
- backups/logs ;
- artefacts macOS.

## Étapes GitHub

1. Créer un dépôt GitHub vide, par exemple `dl-creator-web`.
2. Décompresser le ZIP `DL_creator_web_netlify_ready.zip`.
3. Depuis le dossier du projet :

```bash
git init
git add .
git commit -m "Initial import DL Creator Web Netlify ready"
git branch -M main
git remote add origin https://github.com/<organisation-ou-compte>/dl-creator-web.git
git push -u origin main
```

## Étapes Netlify gratuit

1. Ouvrir Netlify.
2. `Add new site` → `Import an existing project`.
3. Sélectionner GitHub puis le dépôt.
4. Paramètres :
   - Build command : vide ;
   - Publish directory : `.` ;
   - Branch : `main`.
5. Déployer.
6. Ouvrir l'URL Netlify générée.
7. Contrôler la version visible dans l'en-tête de l'application.

## Mise à jour future sans perte de données

1. Modifier les fichiers applicatifs dans le dépôt local.
2. Ne jamais renommer les clés IndexedDB/localStorage sans migration explicite.
3. Tester localement avec :

```bash
python3 -m http.server 8080
```

4. Exporter un JSON de sauvegarde depuis l'application pilote.
5. Commit + push :

```bash
git add .
git commit -m "Update DL Creator Web"
git push
```

6. Netlify redéploie automatiquement.
7. Vérifier que les DL locales sont toujours présentes après rechargement.

## Limites de sécurité client-only

Cette version Netlify gratuite est statique. Elle ne fournit pas :

- authentification serveur forte ;
- contrôle d'accès institutionnel centralisé ;
- audit trail serveur fiable ;
- chiffrement serveur ;
- sauvegarde centralisée automatique ;
- protection contre un utilisateur ayant accès au poste et au navigateur.

Elle convient à un pilote contrôlé ou à un usage interne léger, avec export JSON régulier. Pour une exploitation institutionnelle complète, activer ultérieurement le backend sur serveur dédié selon les documents des phases serveur.

## Checklist post-déploiement

- L'application s'ouvre sur l'URL Netlify.
- Le CSS est chargé.
- `app.js` est chargé.
- Les logos s'affichent.
- Les CSV de `data/` sont chargés.
- Le profil local peut être créé.
- Une DL peut être créée et sauvegardée.
- La bibliothèque locale persiste après rechargement.
- L'export JSON fonctionne.
- L'import JSON fonctionne.
- La version visible correspond à la version livrée.
