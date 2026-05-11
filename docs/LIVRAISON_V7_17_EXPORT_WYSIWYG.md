# DL Creator Web v7.17 - Export PDF WYSIWYG

## Objet
Correction ciblée de la divergence entre l'aperçu PDF affiché dans l'application et le rendu obtenu via l'action navigateur d'impression/export PDF.

## Cause identifiée
L'aperçu PDF était généré dans un iframe avec le DOM PDF actuel, mais le rendu écran et le rendu print utilisaient des règles CSS différentes. L'aperçu écran restait en largeur A4 fixe, provoquant un débordement horizontal sur certains écrans, tandis que les règles `@media print` reprenaient d'autres contraintes de page, footer, break et dimensions. Cette divergence expliquait les écarts de pagination et de positionnement entre l'aperçu et l'export réel.

## Corrections apportées
- Ajout d'un bouton `Exporter PDF` dans la barre principale et dans l'aperçu PDF.
- Le bouton `Exporter PDF` travaille directement depuis l'iframe d'aperçu déjà visible.
- Aucune reconstruction parallèle du template PDF n'est introduite.
- Le DOM PDF reste unique : `pdfPreviewDocumentHtml()` -> `pdfHtml()`.
- L'aperçu PDF est maintenant ajusté automatiquement à la largeur disponible sans scroll horizontal.
- Avant impression/export, les pages vides résiduelles sont retirées et les footers écran sont resynchronisés.
- Les anciennes DL importées continuent à passer par `ensureDLModel()` et le moteur PDF courant.

## Fichiers modifiés
- `app.js`
- `styles.css`
- `js/config.js`
- `docs/LIVRAISON_V7_17_EXPORT_WYSIWYG.md`

## Points de contrôle
- Aucune dépendance cloud ajoutée.
- IndexedDB/localStorage non modifiés.
- Import/export JSON non modifiés.
- Bibliothèque DL non modifiée.
- FIL ROUGE et PLAN HORAIRE non restructurés.
- L'ancien bouton `Imprimer / Exporter PDF` est conservé.
