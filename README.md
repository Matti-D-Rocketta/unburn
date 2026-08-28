# unburn

Application de cuisine qui accompagne un débutant **pendant** qu'il cuisine.

Elle décrit des signaux sensoriels observables — couleur, son, odeur, toucher — au lieu
d'annoncer des durées. Elle travaille sur un garde-manger fermé de 30 ingrédients et
génère des plats à partir de trois structures de cuisson, sans recettes.

## État actuel — Lot 1 sur 3

Ce dépôt ne contient pour l'instant que **les données et le moteur**. Il n'y a pas
d'interface, pas de build, rien à lancer dans un navigateur.

| Lot | Contenu | État |
|-----|---------|------|
| 1 | Données JSON et moteur de génération | fait |
| 2 | Interface React : 7 écrans, 4 composants, `App.jsx` | à faire |
| 3 | PWA, `wakeLock`, journal, export | à faire |

## Lancer les tests

Node 18 minimum. Aucune dépendance à installer.

```bash
node scripts/verifier.mjs
```

44 contrôles, dont les 4 tests d'acceptation de la spécification.

## Arborescence

```
src/data/      ingredients.json    35 entrées : 30 sélectionnables, 4 de socle, 1 hors garde-manger
               structures.json     3 structures génératives
               principes.json      10 principes de cuisine
               plats-fixes.json    le plat long à texte fixe

src/engine/    choisirStructure.js affectation aux slots, score, classement
               ordonnancer.js      tri à deux niveaux : moment, puis rang fin dans la phase
               genererEtapes.js    production des étapes et des marqueurs
               assaisonnement.js   gabarits d'assaisonnement et table de rectification

scripts/       verifier.mjs        tests d'acceptation et contrôles de cohérence
```

Les quatre fonctions du moteur sont pures et reçoivent `{ catalogue, structures }` en
paramètre. Aucun import de JSON dans `src/engine/`.

## Contenu rédactionnel

Les 140 champs `signal` et `signal_long` du catalogue sont préfixés `BROUILLON — `.
Ce sont des marqueurs de position, à réécrire intégralement. Ils constituent la valeur
du produit.

## Contraintes

Pas de backend, pas de comptes, aucun appel réseau, aucun appel à un LLM.
React 18, Vite, Tailwind, `localStorage`. Fonctionnement hors ligne intégral.
Aucune durée affichée comme information principale d'une étape.
