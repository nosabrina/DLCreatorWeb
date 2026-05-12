# DL Creator Web v8.30 — pilote serveur contrôlé

## Intention
La v8.30 prépare un déploiement GitHub/Netlify réel sans activer de dépendance serveur obligatoire. Le mode offline-first reste prioritaire.

## Modes
- `local` : stockage navigateur, backend désactivé.
- `pilote` : Netlify Functions disponibles en dry-run, remote sync désactivée.
- `production` : réservé à une phase ultérieure après validation institutionnelle.

## Services préparés
- Health check Netlify Function.
- Auth login/session en contrat pilote.
- Audit-log en dry-run.
- Mail-test en dry-run.
- Couche API frontend avec timeout, fallback offline et contrat de réponse.

## Verrou PDF
Aucune modification volontaire des moteurs PDF, de PDF.js, html2pdf, jsPDF, de la pagination ou des annexes.
