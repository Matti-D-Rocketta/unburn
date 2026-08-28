# Questions ouvertes à l'entrée du Lot 2

Ces trois points ont été relevés à la fin du Lot 1 et n'ont pas été tranchés.
Le code actuel applique le comportement décrit en premier dans chaque section.
Ne les modifie pas sans instruction : soulève-les, attends la décision.

## 1. Le sel passe devant l'huile sur la structure `plaque`

`assaisonnement_sel` est placé au rang −1 de la phase de mouillage. Sur `poelee` cela
n'a pas d'effet visible, le gras étant au moment `debut`. Sur `plaque`, le gras est au
moment `preparation` — le même que le mouillage — et l'ordre affiché devient :

```
1. Sale maintenant, et à chaque ajout
2. Huile d'olive
```

Défendable : on sale les légumes en les mélangeant à l'huile. Alternative : passer le
rang à 0,5 pour placer le sel juste après le gras.

## 2. Les tomates concassées ne remplissent jamais le slot `liquide`

`tomates_concassees` porte `roles: ["corps", "liquide"]`. Les deux slots sont au moment
`cuisson` sur `poelee`, et la règle « un slot par moment » lui fait prendre `corps`,
déclaré en premier. Le slot `liquide` reste vide.

Sans conséquence fonctionnelle : le booléen `liquide: true` déclenche quand même le
déglaçage et le rang 6 dans le tri fin. Mais le double rôle voulu ne s'exprime pas dans
l'affectation.

## 3. `assaisonnement()` ne fait plus ce que dit le §4 du cahier des charges

La spécification dit qu'elle ajoute trois étapes fixes en fin de parcours. Depuis la
fusion, c'est `ordonnancer` qui pose les trois marqueurs en place, et `assaisonnement()`
ne sert plus que de filet de sécurité — elle ne complète que ce qui manque — et fournit
la table de rectification.

La fonction existe toujours et garde sa signature. Le cahier des charges est à corriger,
ou la fonction à ramener vers sa définition d'origine.

---

## Méthode de travail

Les décisions se prennent dans la conversation d'arbitrage, pas ici. Quand un point de ce
type apparaît pendant le Lot 2 :

1. arrête-toi ;
2. décris le conflit et les options, avec leur coût ;
3. n'applique aucune règle culinaire absente du cahier des charges — signale-la comme un
   manque ;
4. attends la réponse.

`main` ne reçoit que ce qui fait passer `node scripts/verifier.mjs` en entier.
