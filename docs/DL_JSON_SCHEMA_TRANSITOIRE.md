# Schéma JSON transitoire DL Creator Web

## Principe

Le schéma actuel doit rester compatible avec les anciennes DL. Les futures migrations serveur doivent préserver tous les champs inconnus et éviter toute migration destructive.

## Racine observée

Champs principaux :

- `schema`
- `id`
- `referenceDL`
- `version`
- `dateCreation`
- `dateModification`
- `statut`
- `identification`
- `tags`
- `responsables`
- `buts`
- `evaluations`
- `planHoraire`
- `filRouge`
- `materiel`
- `conclusion`
- `distribution`
- `validation`
- `importWord`
- `historique`

## Identification / pédagogie

`identification` contient notamment :

- `domaine`
- `theme`
- `codeTheme`
- `sousTheme`
- `codeSousTheme`
- `typeDoc`
- `resumeCamelCase`
- `typeFormation`
- `niveauBloom`
- `codeBloom`
- `publicCible`
- `codePublic`
- `participantsClasses`
- `dureeTotale`
- `creationModification`

## Responsables et utilisateurs

`responsables` contient :

- `responsable`
- `redacteurs`
- `formateurs`

Les profils utilisateurs locaux sont actuellement stockés hors DL dans `localStorage`, mais les futures validations serveur devront lier les actions à des utilisateurs serveur.

## Buts et évaluations

`buts` et `evaluations` sont des tableaux. Les entrées peuvent contenir du texte, des liens vers d’autres éléments et des informations Bloom. Les futures migrations doivent accepter les anciennes formes simplifiées.

## Fil rouge

`filRouge` est un tableau de sections. Les champs observés peuvent inclure :

- titre / thème de section ;
- durée ;
- contenu HTML ;
- remarques ;
- identifiant de synchronisation `_syncId` ;
- annexes PDF liées ;
- images ou contenus importés.

Les contenus HTML doivent être conservés tels quels lors de l’import/export JSON.

## Plan horaire

`planHoraire` est synchronisé partiellement depuis `filRouge`. Il peut contenir :

- thème ;
- durée ;
- début ;
- fin ;
- formateurs ;
- source automatique liée à une section Fil rouge.

## Matériel / véhicules

`materiel` contient notamment :

- `didactique`
- `materielEngage`
- `fournitures`
- `vehiculesEngages`
- `remarquesLogistiques`

Ces champs dépendent des CSV locaux et doivent rester compatibles avec la saisie actuelle.

## Annexes / PDF / images

Les annexes PDF peuvent contenir :

- nom de fichier ;
- type MIME ;
- taille ;
- nombre de pages ;
- `dataUrl` ;
- pages rendues temporairement pour export.

Les données volumineuses doivent être préservées en JSON tant que l’architecture serveur n’est pas active.

## Distribution / bibliothèque

`distribution` contient les destinataires, groupes, fonctions, remarques et remarques générales HTML/texte.

La bibliothèque actuelle stocke des DL complètes dans IndexedDB. Une future bibliothèque serveur devra distinguer : brouillon privé, DL soumise, DL validée, DL publiée et DL archivée.

## Validation / workflow

`validation` contient :

- `statut`
- `validateur`
- `dateValidation`
- `commentaire`

En Phase 1, ces statuts restent informatifs côté navigateur. En mode serveur futur, ils devront être contrôlés par l’API et journalisés.

## Règles de compatibilité

- Conserver les champs inconnus.
- Ne pas renommer brutalement les champs existants.
- Accepter les tableaux absents en les initialisant à `[]`.
- Accepter les objets absents en les initialisant sans supprimer le reste.
- Ne pas modifier les contenus HTML riches sans action utilisateur.
- Ne pas compresser/supprimer les annexes lors d’une simple normalisation.
