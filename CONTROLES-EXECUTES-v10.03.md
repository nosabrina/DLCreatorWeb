# Contrôles exécutés — v10.03

- Syntaxe `app.js` contrôlée avec `node --check app.js`.
- Présence version v10.03 contrôlée dans les fichiers de configuration.
- Présence du flag `publicCiblePdfBoldBlack11V1003`.
- Cache busting index.html mis à jour.
- Correctif CSS ciblé sur `.pdf-public-cible-v1003`.

## Tests utilisateur à effectuer

- Safari localhost.
- Chrome localhost.
- Export PDF.
- PUBLIC CIBLE première page : noir / bold / 11 pt.
- PUBLIC CIBLE GÉNÉRALITÉS : noir / bold / 11 pt.
- Respect de la casse.
- Diagnostic v10.03.
