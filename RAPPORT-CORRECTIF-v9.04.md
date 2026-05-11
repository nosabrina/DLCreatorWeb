# Rapport correctif v9.04 — GitHub / Netlify readiness

## Version

- Version : `v9.04`
- Build : `2026.05.11-v9.04-github-netlify-readiness`
- Build increment : `104`
- Minimum compatible : `v8.10`

## Correction saveHabilitationsExplicit

### Problème constaté

En v9.03, le bouton `Enregistrer` de Gestion des accès appelait `saveHabilitationsExplicit()` alors que cette fonction n’était pas définie dans `app.js`. Conséquence : `ReferenceError` bloquant, écran de démarrage interrompu ou perte d’accès fonctionnelle au module selon le scénario de chargement.

### Correction appliquée

- Ajout de `window.saveHabilitationsExplicit`.
- Enregistrement explicite de la liste normalisée des habilitations.
- Audit local de l’enregistrement.
- Message utilisateur positif en cas de succès.
- Gestion d’erreur non bloquante en cas d’échec.
- Rendu de Gestion des accès maintenu accessible.
- Ajout d’un garde-fou `installMissingFunctionGuard()` contre fonction critique manquante.

## Gestion des accès

- Bouton `Enregistrer` rendu fonctionnel.
- Droits existants préservés.
- Chef formation conserve le niveau admin structure via la matrice existante.
- Récupération admin locale conservée et renforcée si aucun gestionnaire ne subsiste.
- Champ Personne toujours relié à `PersonnelSDIS.csv` via `CSVStore` / `AutocompleteService`.
- Fallback manuel maintenu si le CSV est absent ou non chargé.

## Stockage / quota

- Ajout de `safeSetLocalStorage()`.
- Ajout de détection `QuotaExceededError`.
- IndexedDB reste prioritaire pour la bibliothèque.
- Suppression du miroir lourd localStorage de la bibliothèque lorsque IndexedDB fonctionne.
- localStorage reste utilisé pour petites données et fallback contrôlé uniquement.

## GitHub readiness

- README.md actualisé.
- VERSION.md actualisé.
- CHANGELOG.md actualisé.
- DEPLOYMENT-NETLIFY.md ajouté.
- ROLLBACK.md ajouté.
- TESTS-RECETTE.md ajouté.
- SECURITY-NOTES.md ajouté.
- LICENSE ajouté.
- .gitignore renforcé.

## Netlify readiness

- `netlify.toml` maintenu avec publish `.` et functions `netlify/functions`.
- Variables Netlify versionnées en v9.04.
- Backend désactivé.
- E-mails réels désactivés.
- Functions préparées uniquement.

## Non-régression volontaire

Non modifié :

- moteur PDF ;
- aperçu A4 ;
- impression ;
- import/export JSON ;
- modèles DL existants ;
- compatibilité anciennes DL ;
- RBAC Chef formation = admin structure.
