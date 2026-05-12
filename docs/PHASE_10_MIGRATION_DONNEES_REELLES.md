# Phase 10 — Migration contrôlée des données réelles

## Principe
La migration est non destructive. Les DL locales sont exportées en JSON, puis importées côté serveur par petit lot.

## Avant import
```bash
cd server
npm run backup-before-import
```

## Import fichier ou dossier
```bash
npm run import-dl-json -- --file ../exports/dl-test.json --owner admin
npm run import-dl-json -- --dir ../exports --owner admin --status draft
```

Options :
- `--status draft` par défaut.
- `--status in_progress` si le document doit apparaître comme commencé.
- `--overwrite` uniquement si l’écrasement est explicitement validé.

## Contrôles
- Lire le rapport `import-dl-json-report-*.json`.
- Ouvrir la DL avec le compte propriétaire.
- Vérifier titre, domaine, public, contenu JSON et médias/base64.
- Tester export JSON après import.

## Rollback
Restaurer la sauvegarde faite avant import si un lot est incorrect. Importer d’abord 1 à 3 DL réelles, puis élargir.
