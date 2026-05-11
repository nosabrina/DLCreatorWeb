# DL Creator Web v8.50 — comptes pilotes réels et validations distribuées contrôlées

## Portée

La v8.50 consolide la plateforme pilote collaborative institutionnelle en restant strictement offline-first. Elle ajoute une couche locale de validation hiérarchique distribuée, comptes pilotes enrichis, RBAC institutionnel, ownership, verrous collaboratifs, détection de conflits préparatoire, audit collaboratif renforcé, notifications pilotes et fonctions Netlify mockées.

## Moteur PDF verrouillé

Aucune modification fonctionnelle n'est apportée à html2pdf, jsPDF, PDF.js, l'aperçu A4, la pagination ou les annexes PDF. Les évolutions v8.50 sont isolées dans les services collaboratifs, le diagnostic et les fonctions serveur préparatoires.

## Validations distribuées

Le service `distributed-validation-service.js` introduit les états préparatoires :

- validation responsable domaine ;
- validation chef formation ;
- validation publication ;
- refus validation ;
- publication bloquée.

Chaque décision ajoute une signature locale préparatoire, un accusé, un événement d'audit et une notification locale. La signature serveur, la validation distante, MFA et horodatage serveur restent préparés mais désactivés.

## Comptes pilotes

`pilot-users-service.js` ajoute des profils multi-rôles réalistes, préférences utilisateur, domaine utilisateur, historique d'actions, traçabilité des connexions, verrouillage de session, import/export, backup et restauration locale.

## RBAC institutionnel

La matrice RBAC intègre les permissions de validation hiérarchique, publication distribuée, ownership, conflit, supervision, lecture restreinte, restrictions domaine, publication et archivage. Les refus sont tracés dans l'audit local.

## Conflits et synchronisation préparatoire

`conflict-sync-service.js` ajoute checksum enrichi, verrou optimiste, journal de synchronisation local, verrous d'édition, comparaison versions, détection de conflits potentiels et stratégie de merge préparatoire. La synchronisation distante reste désactivée par défaut.

## Netlify Functions mockées

Les nouvelles fonctions `validation-distributed`, `users-session`, `workflow-validation`, `workflow-publish`, `collaborative-lock` et `diagnostics-workflow` retournent des réponses standardisées avec correlation-id et fallback offline. Elles ne deviennent pas source de vérité.

## Rituel de validation v8.50

Contrôles attendus : export diagnostic production, export audit local, Safari, localhost via `python3 -m http.server`, console navigateur sans WARN/ERROR applicatif, workflows, validations, import/export, PDF, annexes et offline-first.
