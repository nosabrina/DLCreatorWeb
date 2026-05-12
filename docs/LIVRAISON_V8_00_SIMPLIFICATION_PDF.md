# DL creator web v8.00 — Simplification PDF définitive

## Décision appliquée

La fonction directe `Export PDF` de l’aperçu a été supprimée.

DL creator web v8.00 utilise exclusivement le flux validé : `Imprimer / Exporter PDF`, basé sur l’aperçu HTML/CSS et le moteur d’impression navigateur.

## Modifications

- Suppression du bouton direct `Export PDF` dans l’aperçu PDF.
- Suppression du listener `pdfDirectExport`.
- Suppression du gestionnaire global `DLExportPdfFromPreview`.
- Suppression du moteur PDF alternatif : capture DOM, raster JPEG, PDF vectoriel manuel, Blob PDF direct et fallback associé.
- Conservation du rendu d’aperçu et du flux d’impression navigateur.
- Interface de l’aperçu limitée à deux actions : `Imprimer / Exporter PDF` et `Fermer l’aperçu`.

## Non-régression visée

Aucune règle de pagination, aucun style print et aucun rendu PDF validé n’a été volontairement modifié.
