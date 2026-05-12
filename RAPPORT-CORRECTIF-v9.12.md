# Rapport correctif — DL Creator Web v9.12

## Choix de version

La version v9.12 est un correctif mineur ciblé : elle corrige des flux fonctionnels et UI sans refonte d’architecture ni modification du moteur PDF. Le buildIncrement est fixé à 112 et le build à `2026.05.12-v9.12-library-import-safari-session-access-mail-filrouge-ui`.

## Bibliothèque DL — Import JSON direct

Un bouton `Importer JSON` a été ajouté dans Bibliothèque DL. Il utilise un parseur commun avec l’import JSON existant, normalise le modèle DL, recalcule la référence, persiste dans la bibliothèque locale et journalise `library-json-import` dans l’audit local.

## Safari / session inactive

Le problème venait du garde-fou global de démarrage dans `index.html`, qui affichait `Démarrage interrompu` pour toute erreur globale, même après le chargement de `app.js`. En reprise de session Safari, un incident runtime pouvait donc être traité à tort comme une erreur de boot. Le correctif conserve le blocage des vraies erreurs avant chargement, mais journalise les incidents après boot sans remplacer l’interface.

## Gestion des accès / e-mail

Le flux `Envoyer les accès par e-mail` reste local/offline : aucun backend ni envoi serveur réel n’est activé. L’action prépare le lien d’activation, l’expiration, l’identifiant NIP, conserve l’audit local et ouvre une prévisualisation HTML. Le mailto reste disponible depuis cette prévisualisation.

## E-mail d’accès — titres en gras

Les titres suivants sont en gras dans la prévisualisation HTML : Lien d’activation sécurisé, Identifiant de connexion (NIP), Expiration du lien, Fonction, Droits attribués, Attention. La version texte reste propre pour le copier/coller et le mailto.

## Fil rouge UI

Le bouton `Ajouter une section` est déplacé sous la dernière section, avec un `+` rouge RAL3000 et un texte en gras. Les icônes de réorganisation et la poubelle sont en rouge RAL3000, avec alignement vertical de la poubelle.

## Contrôles exécutés

- `node --check app.js`
- `node --check js/config/version.js`
- `node --check config/runtime-config.js`
- `node --check config/app-config.js`
- `node --check config/feature-flags.js`
- Vérification des chaînes v9.12/build/cache busting dans les fichiers modifiés

## Limites

Les tests Safari/Chrome réels, le refresh après 15 minutes d’inactivité, les imports JSON réels et les exports diagnostic/audit v9.12 doivent être confirmés côté utilisateur dans l’environnement local.
