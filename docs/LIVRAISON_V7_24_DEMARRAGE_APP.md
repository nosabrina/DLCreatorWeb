# Livraison v7.24 — Correctif démarrage application

## Problème corrigé
La version v7.23 pouvait rester bloquée sur l'écran « Chargement de DL Creator Web… ».

## Cause
Une erreur de syntaxe JavaScript avait été introduite dans la fonction d'échappement des chaînes PDF (`pdfLiteralString`) : expression régulière de remplacement des retours ligne et échappement du caractère antislash mal sérialisés.

## Correction
- Correction de la regex `replace(/[\r\n]/g, ' ')`.
- Correction de l'échappement PDF des caractères `(`, `)` et `\\`.
- Correction de l'écriture des caractères accentués en notation octale PDF.
- Contrôle syntaxique de `app.js` avec `node --check`.

## Périmètre
Aucune modification fonctionnelle hors correction de démarrage et export PDF associé.
