# Phase 10 — SMTP pilote

Le pilote démarre avec :
```env
MAIL_ENABLED=false
MAIL_DRY_RUN=true
```

Étapes :
1. Vérifier les notifications en dry-run.
2. Contrôler les logs e-mail.
3. Renseigner SMTP institutionnel.
4. Tester vers l’Admin uniquement.
5. Activer progressivement.
6. Désactiver immédiatement en cas d’erreur : `MAIL_ENABLED=false`.

Aucun secret SMTP ne doit être inclus dans le ZIP.
