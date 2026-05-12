# Phase 10 — Utilisateurs réels et rôles

## Création Admin initial
```bash
npm run seed:admin
```

## Création utilisateur pilote
```bash
npm run create-user -- --username jdupont --email j.dupont@sdis.local --role responsible
```
Un mot de passe temporaire est généré et affiché une seule fois si `--password` n’est pas fourni.

## Rôles
| Rôle | Usage |
|---|---|
| `admin` | Administration, dashboard, validation, audit |
| `validator` | Validation, assignation, bibliothèque |
| `responsible` | Création et suivi des DL attribuées |
| `creator` | Création personnelle |
| `read_only` | Lecture élargie sans modification |
| `library_reader` | Lecture bibliothèque uniquement |

Le rôle serveur est la seule source de vérité. Les droits legacy locaux ne remplacent pas les rôles serveur.
