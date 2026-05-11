# DL Creator Web v7.16 — Correctif reset Plan horaire

## Périmètre
- Correction strictement limitée à la remise à zéro des champs formateur du Plan horaire.
- Correction du libellé **FORMATEUR ET TRANCHES HORAIRES DE LA LEÇON**.
- Version applicative visible mise à jour en v7.16.

## Corrections
- Le champ global **FORMATEUR DE LA LEÇON** est vidé lors de **Remise à zéro DL**.
- Tous les champs **Formateur** des lignes du Plan horaire sont vidés lors de **Remise à zéro DL**.
- Les horaires, sections, durées et remarques existants restent gérés par la logique déjà en place.
- Correction du libellé fautif dans l’interface et la documentation de livraison.

## Tests ciblés
- Reset avec champ global vide.
- Reset avec champ global rempli.
- Reset avec plusieurs lignes Plan horaire et formateurs manuels.
- Vérification du libellé corrigé dans le code livré.
