# DL Creator Web v7.16 — Plan horaire et version document

## Périmètre

Correction strictement limitée au Plan horaire et à la synchronisation de version document / entête.

## Corrections

- Ajout du champ **FORMATEUR DE LA LEÇON** dans le bloc **FORMATEUR ET TRANCHES HORAIRES DE LA LEÇON**.
- Icône institutionnelle `person.wave.2.fill` en rouge, alignée avec le champ.
- Application automatique du formateur global aux lignes existantes vides du plan horaire.
- Application automatique aux nouvelles lignes ajoutées après sélection.
- Conservation des formateurs déjà saisis manuellement.
- Si le champ global est vidé, les formateurs déjà appliqués restent en place.
- Persistance JSON/localStorage/IndexedDB compatible avec les anciennes DL.
- Affichage PDF discret du formateur global uniquement lorsqu’il est renseigné.
- Synchronisation de la version document depuis une référence contenant `vX.XX` ou `VX.XX`, normalisée en minuscule.
- Version applicative visible mise à jour en v7.16.

## Compatibilité

Les anciennes DL sans `planFormateurLecon`, `planTrancheCount` ou `planTranchesHoraires` reçoivent une valeur par défaut sûre au chargement.
