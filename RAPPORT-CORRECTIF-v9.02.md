# RAPPORT CORRECTIF v9.02 — finalisation accès, profils et bibliothèque

## Base de travail
Version source : DL creator web v9.01.
Version livrée : v9.02.
Build : `2026.05.11-v9.02-finalisation-acces-profils-bibliotheque`.
Build increment : 102.

## Corrections appliquées

### Gestion des accès
- Ajout des champs visibles NIP, grade, prénom, nom et e-mail dans Gestion des accès.
- Stabilisation du champ Personne afin que la saisie s’affiche immédiatement.
- Alignement de l’autocomplete Gestion des accès sur le moteur CSV `PersonnelSDIS.csv` déjà utilisé par les champs de type personnel.
- Sélection d’une personne depuis `PersonnelSDIS.csv` avec remplissage de NIP, grade, prénom, nom, e-mail et nom complet.
- Le NIP devient l’identifiant de connexion préparé.
- Conservation de la saisie libre si le CSV est absent ou incomplet.

### Cohérence Profil utilisateur
- Gestion des accès devient la source de vérité préparée pour NIP, grade, prénom, nom, e-mail et droits.
- Le Profil utilisateur affiche les informations issues de l’accès local.
- Le profil utilisateur conserve la possibilité de modifier l’e-mail et le mot de passe, avec les autres champs affichés en lecture seule.

### E-mail d’accès
- Objet remplacé par : `SDIS régional du Nord vaudois : tes données d'accès à l'application DL creator web`.
- L’identifiant/login dans l’e-mail est le NIP, jamais l’adresse e-mail.
- Le modèle mentionne le lien d’accès, le NIP, le mot de passe provisoire et l’obligation de changement à la première connexion.
- Aucun envoi serveur réel n’est activé.

### Mes descentes de leçon
- `Consulter` ouvre la DL en mode lecture seule.
- `Modifier` ouvre la DL en mode édition et déclenche une confirmation lors de l’enregistrement manuel.
- Ajout du bouton `Exporter PDF`, réutilisant la fonction PDF existante sans modification du moteur PDF.

### Bibliothèque mots clés
- Recherche filtrée uniquement à partir de 3 caractères.
- Message discret avant 3 caractères : `Saisir au moins 3 caractères pour rechercher.`

### Bibliothèque DL
- Suppression du bouton ambigu `Importer` dans `DL sélectionnée` afin d’éviter la duplication silencieuse.
- `Ouvrir` reste l’action de chargement d’une DL existante.
- `Archiver` vérifie les droits, demande confirmation, passe le statut à `Archivé`, met à jour le workflow local et sauvegarde IndexedDB.

## Points conservés
- Moteur PDF non modifié.
- Aperçu A4 non modifié.
- Impression navigateur non modifiée.
- IndexedDB conservé.
- Import/export JSON conservé.
- Backend, sync distante, serverAuth et e-mails transactionnels serveur restent désactivés par défaut.
- Droits Chef formation = Admin structure conservés.

## Contrôles exécutés
- `node --check app.js` OK.
- `node --check` sur tous les fichiers JavaScript OK.
- `scripts/check-critical-files.js` OK.
- Démarrage local `python3 -m http.server` : `index.html` accessible HTTP 200.
- Netlify Function `diagnostics-ping` testée en Node : HTTP 200, version v9.02.
