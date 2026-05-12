# CHANGELOG

## v10.00 — 2026-05-12

Évolution majeure du Fil rouge.

### Ajouté
- Gestion d’images liées à chaque section du Fil rouge.
- Bouton `Ajouter photo` avec icône rouge RAL3000 `photo.badge.plus` simulée en CSS.
- Sélection multiple JPG/JPEG/PNG/WEBP depuis l’ordinateur.
- Zone Drag&Drop lorsque la section contient déjà des images.
- Galerie responsive type bibliothèque photos, avec suppression par image.
- Légende modifiable par image, sauvegardée dans la DL.
- Export PDF des images après les remarques de section, avec largeur maximale 5 cm et légende 8 pt.
- Audit local des ajouts, suppressions, légendes et imports via fichier ou Drag&Drop.

### Compatibilité
- Anciennes DL sans images restent compatibles.
- Import/export JSON étendu de manière rétrocompatible via `section.images[]`.
- Aucun backend activé, aucun envoi réseau, aucune dépendance externe ajoutée.

### Versioning
- Passage de v9.13 à v10.00 justifié par l’évolution fonctionnelle majeure du Fil rouge et du PDF.
- Nouvelle convention de nommage des livrables : `DLCreatorWeb vXX.XX.zip`.
