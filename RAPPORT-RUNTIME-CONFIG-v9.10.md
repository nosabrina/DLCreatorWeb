# Rapport runtime config — v9.10

## Fichiers ajoutés

- `config/runtime-config.js`
- `config/app-config.js`
- `config/feature-flags.js`

## Principe

Ces fichiers contiennent uniquement une configuration publique frontend : version, build, mode runtime, API base URL publique, flags de préparation et désactivation des composants serveur.

## Secrets

Aucun JWT secret, clé API fournisseur, token ou mot de passe ne doit être placé dans ces fichiers.
