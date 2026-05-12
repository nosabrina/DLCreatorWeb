# DL creator web v8.80 — stabilisation production pilote

## Objectif
Stabilisation de la plateforme pilote collaborative réelle issue de v8.71, sans ajout massif de fonctionnalité et sans modification du moteur PDF.

## Fichiers modifiés
- `index.html`
- `app.js`
- `js/config/version.js`
- `js/config.js`
- `js/dl-model.js`
- `js/services/storage/migration-service.js` *(nouveau)*
- `js/services/storage/indexeddb-service.js`
- `js/services/storage/remote-storage-service.js`
- `js/services/storage/storage-adapter.js`
- `js/services/audit/audit-service.js`
- `js/services/auth/session-service.js`
- `js/services/backup/backup-service.js`
- `js/services/mail/mail-service.js`
- `js/services/users/pilot-users-service.js`

## Stabilisations réalisées
- Version normalisée en `v8.80` dans l’entête, la configuration, le diagnostic, les exports et les modules de service.
- Cache-busting des scripts et styles aligné sur `20260511-v8.80`.
- Ajout d’un journal local de migration version avec diagnostic “migration réussie”.
- Renforcement de la sauvegarde bibliothèque : miroir IndexedDB + localStorage, fallback non destructif si IndexedDB est indisponible.
- Diagnostic production v4 structuré : bibliothèque, migrations, conflits, workflow, RBAC, validation, offline-first, stockage, synchronisation, compatibilité, sauvegarde, corruption JSON, audit et verrous.
- Export diagnostic enrichi avec migration, journal migration, bibliothèque, stockage, workflow, RBAC, validation, conflits et éléments préparés mais désactivés.
- Audit local renforcé : actions migration/sauvegarde, rotation conservée, purge contrôlée.
- Plan horaire : conservation des formateurs manuels ; le champ global “FORMATEUR DE LA LEÇON” ne propage plus une saisie partielle sur simple blur si elle ne correspond pas à une sélection exacte.

## Zones volontairement non modifiées
- Moteur PDF / html2pdf / jsPDF / PDF.js.
- Aperçu A4, pagination, annexes PDF, impression/export PDF.
- Import/export JSON et ZIP.
- Architecture générale offline-first.

## Contrôles effectués
- Vérification syntaxique `node --check` de `app.js` et de tous les fichiers JavaScript du dossier `js/`.
- Vérification des références scripts de `index.html`.
- Contrôle de cohérence version v8.80 dans les fichiers applicatifs principaux.

## Limites restantes
- Les contrôles Safari, multi-onglets et export PDF doivent être réalisés manuellement côté poste utilisateur avec `python3 -m http.server`, car ils dépendent du navigateur réel, du stockage local existant et des données de test.
- Les services serveur, e-mails transactionnels et synchronisation distante restent préparés mais désactivés.

## Recommandation phase suivante
Phase v8.90 : recette pilote multi-profils réelle, avec collecte systématique des exports diagnostic + audit local après tests Safari/localhost et contrôle manuel des workflows distribués.
