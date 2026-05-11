# Phase 1 — Checklist de non-régression

## Démarrage

- [ ] Ouvrir `index.html` directement dans un navigateur.
- [ ] Vérifier que l’écran de login apparaît.
- [ ] Vérifier l’absence d’erreur console au chargement.
- [ ] Vérifier que `window.DLCreatorCore` existe dans la console.

## Login legacy

- [ ] Créer ou charger un profil existant.
- [ ] Se connecter avec le login local actuel.
- [ ] Se déconnecter.
- [ ] Se reconnecter.

## Création / édition DL

- [ ] Créer une nouvelle DL.
- [ ] Modifier Généralités.
- [ ] Modifier responsables, rédacteurs et formateurs.
- [ ] Ajouter des buts et évaluations.
- [ ] Ajouter plusieurs sections Fil rouge.
- [ ] Vérifier la synchronisation Plan horaire.
- [ ] Modifier Matériel / véhicules / fournitures.

## Autocomplete CSV

- [ ] PersonnelSDIS : recherche accent/casse partielle.
- [ ] ListeVehiculeSDIS : sélection visible et correcte.
- [ ] Materiel : sélection correcte.
- [ ] Fournitures : sélection correcte.

## Sauvegarde locale / IndexedDB

- [ ] Sauvegarder manuellement.
- [ ] Vérifier la présence en Bibliothèque DL.
- [ ] Fermer et rouvrir le navigateur.
- [ ] Recharger la DL depuis la bibliothèque.
- [ ] Supprimer une DL de test.

## JSON

- [ ] Exporter une DL en JSON.
- [ ] Importer le JSON exporté.
- [ ] Vérifier que les champs principaux sont conservés.
- [ ] Vérifier que les annexes éventuelles ne disparaissent pas.

## PDF

- [ ] Générer un aperçu PDF.
- [ ] Fermer l’aperçu sans perte de DL courante.
- [ ] Imprimer/exporter PDF depuis l’aperçu.
- [ ] Vérifier que le rendu existant n’a pas changé volontairement.

## Console

- [ ] Aucune erreur JavaScript au chargement.
- [ ] Aucune erreur lors de la sauvegarde.
- [ ] Aucune erreur lors de l’import/export JSON.
- [ ] Aucune erreur lors du PDF.
