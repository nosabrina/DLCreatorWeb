# Rapport stockage / quota v9.04

## Correction principale

La bibliothèque complète n’est plus écrite comme miroir lourd dans localStorage lorsque IndexedDB fonctionne.

## Comportement attendu

- IndexedDB disponible : écriture bibliothèque dans IndexedDB, suppression du miroir legacy lourd localStorage.
- IndexedDB indisponible : fallback localStorage contrôlé.
- QuotaExceededError : erreur non bloquante, journalisée, avec message utilisateur.
- Audit local : rotation existante conservée.

## Limites

Le navigateur reste responsable du quota local. Il faut continuer à utiliser les exports JSON/ZIP de sauvegarde avant toute recette importante.
