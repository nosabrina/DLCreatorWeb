# Phase 7 — RGPD et sécurité des données

Cette note prépare la validation interne SDIS. Elle ne constitue pas un avis juridique et ne prétend pas établir une conformité RGPD complète sans contrôle du responsable légal/informatique.

## Données traitées
Comptes utilisateurs, noms, e-mails, rôles, historiques d’accès, DL rédigées, commentaires workflow, données de formation, annexes intégrées au JSON, logs techniques et audit trail.

## Rôles
`admin`, `validator`, `responsible`, `creator`, `reader`. Les droits effectifs doivent être appliqués côté serveur, jamais uniquement côté front-end.

## Logs et audit
Les logs masquent mots de passe, tokens, secrets SMTP et hash. L’audit conserve action, utilisateur, date, IP, user-agent, severity et request_id. Durée indicative : `AUDIT_RETENTION_DAYS=365`, à valider institutionnellement.

## E-mails
Les notifications restent en dry-run par défaut. Le SMTP réel doit être activé seulement après validation technique et institutionnelle.

## Conservation
DL, comptes, audit, logs et sauvegardes doivent suivre une politique SDIS officielle. La désactivation de compte est privilégiée à la suppression immédiate lorsqu’une traçabilité est nécessaire.

## Points à valider
Base légale, information utilisateurs, hébergement, accès administrateurs, durée de conservation, procédure incident, export/suppression des données, sauvegardes et restauration.
