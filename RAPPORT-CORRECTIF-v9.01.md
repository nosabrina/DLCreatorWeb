# RAPPORT-CORRECTIF v9.02 — Gestion des accès / RBAC

## Cause du crash
La ligne app.js:2379 contenait `getByPath(o,path){ return path.split('.')... }`. Lorsqu’un événement de saisie dans Gestion des accès / Personne était déclenché sur un champ sans `data-path`, `path` valait `undefined`. Safari interrompait alors le chargement avec `TypeError: undefined is not an object (evaluating 'path.split')`.

## Correction appliquée
- Ajout de `safePathParts`, `safeGetByPath` et `safeSetByPath`.
- `getByPath` et `setByPath` passent désormais par ces garde-fous.
- `bindInputs` ignore proprement les chemins invalides et journalise un WARN non bloquant.
- Aucun simple masquage global : la cause directe est corrigée.

## Gestion des accès / PersonnelSDIS.csv
- L’autocomplete utilise `PersonnelSDIS.csv` via `AutocompleteService` et accepte nom, prénom, NIP, login et e-mail.
- Recherche tolérante casse/accents et partielle dès 2 caractères.
- Si le CSV est indisponible, la saisie manuelle reste possible sans crash.

## E-mail
- L’affichage ne génère plus un e-mail fantôme depuis le nom.
- La sélection CSV préremplit l’e-mail uniquement si le champ est vide.
- Une modification manuelle de l’e-mail est conservée et persistée dans l’habilitation.

## RBAC
- `Chef formation` propose maintenant `ADMIN STRUCTURE APPLICATION` dans la gestion des accès.
- Le service RBAC donne à `chefFormation` la même base de permissions que `admin`.
- Documentation : Chef formation dispose des droits structure application équivalents à Admin, car il est responsable fonctionnel de l’application.

## Diagnostic Functions
En localhost statique (`python3 -m http.server`), un 404 Functions est maintenant classé `unavailable-local-static` / fallback OK avec message explicite : normal hors Netlify Dev / Netlify Preview.

## Tests exécutés
- `node --check app.js`
- `node --check` sur les services JS modifiés
- vérification présence PersonnelSDIS.csv
- vérification absence de modification du moteur PDF
