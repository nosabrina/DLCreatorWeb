# Sauvegarde et restauration

## Sauvegarde v8.30

- Export JSON des DL.
- Export manuel de la bibliothèque.
- Export diagnostic production.
- Export audit local.
- Sauvegarde GitHub avant chaque livraison.

## Restauration

1. Restaurer le tag GitHub stable.
2. Redéployer Netlify.
3. Réimporter les JSON DL si nécessaire.
4. Vérifier la version du backup et le schéma `dl.creator.web.v2`.

## Checksums

La v8.30 documente le besoin de checksum. L’implémentation cryptographique complète est prévue en phase serveur.
