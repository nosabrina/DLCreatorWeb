# DL creator web v6.127 — Correctifs UX / onglets / PDF

## Base de départ

Version source utilisée : `DL creator web v6.126.zip`.

## Fichiers modifiés

- `app.js`
- `styles.css`
- `js/config.js`
- `docs/LIVRAISON_V6_127_CORRECTIFS_UX_PDF.md`

## Corrections appliquées

### 1. Ordre des onglets

L’onglet `Conclusion & diffusion` est désormais positionné avant `Matériel & véhicules`.

Ordre DL :

1. Généralités
2. Buts & évaluations
3. Fil rouge
4. Plan horaire
5. Conclusion & diffusion
6. Matériel & véhicules
7. Validation

### 2. Ordre PDF

Dans l’export PDF, la section `Conclusion / discussion finale` est désormais générée avant `Matériel, véhicules et logistique`.

Aucun contenu PDF n’a été modifié en dehors de cet ordre.

### 3. PUBLIC CIBLE

La présentation par grande liste de chips/badges visible en permanence a été supprimée.

Le champ `PUBLIC CIBLE` utilise maintenant :

- une liste déroulante compacte avec catégories : Personnel, Spécialiste, Opérationnel ;
- une zone de saisie libre complémentaire discrète ;
- la même persistance métier que la v6.126 : `publicCible`, `publicCibleSelections`, `publicCibleLibre` ;
- une compatibilité avec les anciennes DL via la normalisation existante.

## Points de non-régression préservés

- Offline-first conservé.
- IndexedDB/localStorage non modifiés.
- Autosave non refondu.
- Import/export JSON conservés.
- Rétrocompatibilité anciennes DL conservée.
- PDF conservé hors ordre demandé.
- Changement d’onglet conservé.
- Saisie libre PUBLIC CIBLE conservée.
