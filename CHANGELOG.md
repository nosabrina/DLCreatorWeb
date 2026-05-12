## v10.04 — 2026-05-12

### Correctif mineur ciblé

- Fil rouge : ajout d’une réorganisation des photos par flèches gauche/droite, avec Drag&Drop horizontal local en complément.
- Fil rouge : conservation des légendes avec leur photo lors du déplacement, sauvegarde/rechargement et export/import JSON.
- Export PDF : PUBLIC CIBLE en première page et dans GÉNÉRALITÉS rendu en noir, bold, 10 pt, en respectant la casse utilisateur.
- Import/export JSON : conservation du statut métier d’une DL validée, avec date, validateur et métadonnées existantes si présentes.
- Audit local : ajout de `filRougeImageReordered` et `dlValidationStatusPreservedOnImport` sans création d’une nouvelle validation locale.
- Aucun changement volontaire sur RBAC global, Gestion des accès, backend, Netlify Functions, e-mails, synchronisation distante, menus ou autres blocs PDF.

## v10.02 — 2026-05-12

### Correctif mineur ciblé

- Correction de l’alignement du titre PDF `IMAGES LIÉES À CETTE SECTION` avec le contenu de section.
- Affichage du contenu `PUBLIC CIBLE` en gras dans la page de garde PDF et dans `GÉNÉRALITÉS`, en respectant la casse saisie.
- Fond légèrement grisé pour les champs de légende des photos dans le Fil rouge, avec texte lisible.
- Fond légèrement grisé pour les légendes PDF, largeur identique aux photos 5 cm, alignement du texte à gauche.
- Normalisation des légendes : première lettre automatiquement en majuscule, sauf si le premier caractère est un chiffre.
- Aucun changement RBAC, validation, backend, Netlify Functions, e-mails, synchronisation distante ou autres blocs PDF.

# Changelog

## v10.02 — 2026-05-12

Correctif mineur ciblé sur la galerie images du Fil rouge, sans modification RBAC, backend, Netlify Functions, e-mails, workflows de validation ni autres blocs PDF.

- Zone Drag&Drop affichée directement dans `IMAGES LIÉES À CETTE SECTION`.
- Zone Drag&Drop cliquable avec sélection multiple JPG/JPEG/PNG/WEBP et fallback input fichier.
- Suppression du bouton `Ajouter photo`.
- Confirmation obligatoire avant suppression d’une photo liée à une section.
- Import des images recadré/redimensionné en 4:3 sans déformation, compatible portrait et paysage.
- Export PDF des images Fil rouge fixé à 5 cm de largeur, sans bordure, avec centrage et espacement homogènes.
- Légendes PDF maintenues en 8 pt sans espace réservé si vide.
- Audit local complété pour import par clic, import Drag&Drop, recadrage 4:3, modification de légende et suppression confirmée.

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
