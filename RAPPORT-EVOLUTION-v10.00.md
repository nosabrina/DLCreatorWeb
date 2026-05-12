# Rapport d’évolution — DLCreatorWeb v10.00

## Justification v10.00
Le passage de v9.13 à v10.00 est justifié par une évolution fonctionnelle majeure : ajout d’une galerie d’images par section dans le Fil rouge, extension du modèle JSON, audit local dédié et intégration PDF.

## Architecture données
Chaque section Fil rouge accepte désormais `images[]` avec `id`, `name`, `mimeType`, `dataUrl`, `width`, `height`, `caption`, `createdAtUTC`. La normalisation est rétrocompatible : les anciennes DL sans images ouvrent `images: []` automatiquement.

## UI galerie
La galerie reste absente lorsqu’aucune image n’est ajoutée. Le bouton `Ajouter photo` est visible après les remarques de section. Dès qu’une image existe, une zone Drag&Drop et une grille responsive apparaissent. Chaque image dispose d’une vignette, d’un champ légende et d’une suppression dédiée.

## Export PDF
Les images sont injectées dans la section Fil rouge après les remarques, en galerie compacte. Chaque image est contrainte à `5cm` de largeur maximale, sans déformation, avec légende en `8pt`. Le moteur PDF n’a pas été refondu.

## Compatibilité JSON
L’export JSON inclut automatiquement les images car elles font partie du modèle courant. L’import JSON est rétrocompatible via `normalizeFilRougeSection`.

## Audit local
Événements journalisés : ajout image, suppression image, modification légende, import via sélection fichier, import via Drag&Drop.

## Sécurité et robustesse
Les formats acceptés sont JPG/JPEG/PNG/WEBP. Les fichiers non image sont refusés proprement. Aucun backend, stockage distant, e-mail serveur ou dépendance externe n’a été ajouté.
