# Rapport correctif — DLCreatorWeb v10.02

## Justification

v10.02 est un correctif mineur ciblé faisant suite à v10.01. Le périmètre est limité au rendu PDF des images du Fil rouge, au rendu du champ Public cible et au formatage/affichage des légendes des photos.

## Corrections appliquées

- Alignement du titre PDF `IMAGES LIÉES À CETTE SECTION` avec le contenu de section.
- Maintien du rendu galerie : photos 5 cm, sans bordure, centrées et espacées.
- Légendes PDF sous les photos : fond légèrement grisé, largeur 5 cm, texte aligné à gauche, taille 8 pt.
- Champs de légende dans le Fil rouge : fond légèrement grisé et texte lisible.
- Normalisation automatique des légendes : première lettre en majuscule, sauf si le premier caractère est un chiffre.
- Contenu `PUBLIC CIBLE` en gras dans la page de garde PDF et dans `GÉNÉRALITÉS`, sans transformation forcée de casse.

## Non modifié

- RBAC.
- Gestion des accès.
- Bibliothèque DL.
- Workflow validation.
- Netlify Functions.
- Backend.
- E-mails serveur.
- Synchronisation distante.
- Autres blocs PDF hors demandes ciblées.
