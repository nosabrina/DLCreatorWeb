# Rapport correctif — DLCreatorWeb v10.01

## Justification du passage v10.01

v10.01 est un correctif mineur ciblé sur la galerie images du Fil rouge introduite en v10.00. Aucun changement volontaire n'a été apporté au RBAC, à la Gestion des accès, à la Bibliothèque DL, au workflow de validation, aux Netlify Functions, au backend, aux e-mails serveur, à la synchronisation distante, aux menus existants ou aux autres blocs PDF.

## Rapport Drag&Drop

- La zone Drag&Drop est affichée directement dans `IMAGES LIÉES À CETTE SECTION`, même lorsqu'aucune image n'est encore présente.
- La zone contient l'icône simulée `photo.badge.plus` en rouge RAL3000 à gauche du texte.
- Le clic sur la zone ouvre l'input fichier caché avec sélection multiple.
- Les événements `dragover`, `dragleave` et `drop` restent compatibles Safari/Chrome.
- Le fallback input fichier HTML est conservé.

## Rapport suppression bouton Ajouter photo

- Le bouton visible `Ajouter photo` a été retiré du rendu HTML.
- L'action d'ajout est désormais portée uniquement par la zone Drag&Drop cliquable.
- Aucun doublon visuel d'ajout photo n'est conservé.

## Rapport confirmation suppression photo

- La suppression d'une photo ouvre une modale de confirmation dédiée.
- Titre : `Suppression de la photo`.
- Message : `Confirmer la suppression de cette photo liée à la section ?`.
- Boutons : `Annuler` et `Supprimer`.
- L'audit local de suppression n'est écrit qu'après confirmation explicite.
- Une suppression annulée ne supprime rien et ne journalise pas de suppression effective.

## Rapport redimensionnement / cadrage 4:3

- Chaque image importée est lue dans un canvas.
- Un recadrage centré 4:3 est appliqué dès l'import.
- Les images portrait et paysage sont acceptées sans déformation.
- L'image finale est encodée en JPEG qualité raisonnable pour PDF et stockage offline-first.
- Les métadonnées `width`, `height`, `ratio: '4:3'` et `cropApplied` sont conservées avec l'image.

## Rapport export PDF 5 cm / sans bordure / centrage

- Les images Fil rouge dans le PDF sont fixées à 5 cm de largeur.
- Le ratio 4:3 est respecté via l'image déjà uniformisée et les règles CSS PDF.
- Les bordures PDF spécifiques autour des images ont été supprimées.
- La galerie PDF utilise un espacement horizontal régulier et un centrage global.
- Les légendes restent sous l'image en 8 pt ; aucune légende vide ne génère de bloc inutile.

## Rapport compatibilité JSON

- Le champ `images` existant est conservé.
- Les anciennes DL sans images restent compatibles via `normalizeFilRougeSection`.
- Les images v10.00 restent lisibles ; les nouveaux imports v10.01 stockent une image 4:3 normalisée.
- L'export/import JSON continue d'utiliser les dataURL intégrées existantes.

## Rapport audit local

Événements concernés :

- `filrouge-image-drop-import`
- `filrouge-image-click-import`
- `filrouge-image-crop-43-applied`
- `filrouge-image-caption-update`
- `filrouge-image-delete-confirmed`

## Points à tester côté utilisateur

- Safari localhost.
- Chrome localhost.
- Fil rouge → zone Drag&Drop visible directement.
- Clic zone Drag&Drop.
- Ajout photo unique.
- Ajout photos multiples.
- Drag&Drop.
- Suppression annulée.
- Suppression confirmée.
- Légende image.
- Portrait 4:3.
- Paysage 4:3.
- Sauvegarde puis rechargement.
- Export JSON.
- Import JSON ancienne DL.
- Import JSON avec images.
- Export PDF avec images.
- Contrôle largeur image PDF 5 cm.
- Contrôle absence bordure PDF.
- Contrôle centrage/espacement PDF.
- Contrôle légende PDF 8 pt.
- Diagnostic v10.01.
- Audit local v10.01.
