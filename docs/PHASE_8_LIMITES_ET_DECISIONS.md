# Phase 8 — Limites restantes et décisions

## Prêt pour pré-production locale

- Backend Node/Express installable.
- Base SQLite créée automatiquement.
- Migrations renforcées côté `database.js`.
- Seed Admin contrôlable.
- Smoke-test API disponible.
- Notifications utilisables en dry-run.
- Mode local conservé par défaut.

## À valider institutionnellement avant production

- Politique de comptes, rôles et habilitations.
- Politique RGPD, durée de conservation, droit d'accès, traçabilité.
- Nom de domaine, HTTPS et reverse proxy.
- Journalisation et supervision serveur.
- Procédure de sauvegarde réelle et test de restauration planifié.
- Procédure de rotation des secrets.

## SMTP réel

SMTP reste désactivé par défaut : `MAIL_ENABLED=false`, `MAIL_DRY_RUN=true`. L'activation réelle doit être testée avec un relais institutionnel validé, sans journaliser de mot de passe SMTP.

## Migration des données locales existantes

La Phase 8 ne migre pas automatiquement les IndexedDB/localStorage des postes existants vers le serveur. Cette migration doit faire l'objet d'une Phase 9 dédiée : inventaire, export JSON, import contrôlé, dédoublonnage, traçabilité.

## SQLite vs PostgreSQL

SQLite convient à la pré-production locale et à un pilote maîtrisé. Pour une production multi-utilisateurs plus large, PostgreSQL reste à évaluer selon hébergement, sauvegardes, concurrence d'accès, supervision et exigences institutionnelles.

## Tests charge/performance

Non couverts par cette phase. À prévoir avant ouverture large : montée en charge API, taille JSON/PDF, concurrence de validation, volumétrie bibliothèque, sauvegardes.
