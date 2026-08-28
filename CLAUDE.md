# CLAUDE.md — unburn

Contexte permanent du projet. Lis ce fichier avant toute modification.

## Ce que fait l'application

Elle accompagne un débutant **pendant** qu'il cuisine. Elle décrit des signaux
sensoriels observables — couleur, son, odeur, toucher — au lieu d'annoncer des durées.
Elle travaille sur un garde-manger fermé de 30 ingrédients et génère des plats à partir
de trois structures de cuisson. Elle doit se suffire dans la cuisine, sans renvoyer vers
une vidéo ni vers une lecture préalable.

Un seul utilisateur la testera pendant trois semaines.

## Stack imposée

React 18 · Vite · JavaScript · Tailwind 3.4 · `localStorage` · PWA hors ligne intégral.
Navigation par machine à états dans `App.jsx`.

`postcss` et `autoprefixer` sont tolérés en dépendances de développement.
**Aucune autre dépendance** : pas de routeur, pas de gestionnaire d'état, pas de
bibliothèque de composants.

## Interdits absolus

- Backend, comptes utilisateur, appel réseau de quelque nature
- Appel à un LLM, y compris à l'exécution
- Toute dépendance non listée ci-dessus
- Toute durée affichée comme information principale d'une étape

## Règle de contenu — la plus importante

Tous les champs `signal` et `signal_long` sont préfixés `BROUILLON — `.
**Ne les réécris jamais.** Ce sont des marqueurs de position réservés au propriétaire du
projet : ils constituent la valeur du produit et ne peuvent pas venir d'un modèle.

Si tu crées un nouveau champ de signal, préfixe-le `BROUILLON — ` et respecte le gabarit
à trois modalités : **vue**, **son ou odeur**, **toucher**. Jamais une durée seule.

N'invente aucune règle culinaire absente de la spécification. Signale-la comme un manque.

## Découpage en lots, avec arrêt entre chacun

| Lot | Contenu | État |
|-----|---------|------|
| 1 | Données JSON et moteur | **fait**, 44 contrôles au vert |
| 2 | 7 écrans, 4 composants, `App.jsx` | à faire |
| 3 | PWA, service worker, `wakeLock`, journal, export, README complet | à faire |

**Arrête-toi à la fin de chaque lot et attends validation.** N'anticipe pas sur le lot
suivant.

## Décisions d'architecture verrouillées

Ces points ont été arbitrés et ne se rediscutent pas sans instruction explicite.

**Socle implicite.** Quatre ingrédients portent `base: true` — huile d'olive, sel fin,
poivre, vinaigre de cidre. Toujours disponibles, injectés par le moteur, hors du
compteur de 3 à 6 ingrédients. Ils sont `selectionnable: false` mais
`essentiel_courses: true`.

**Slots bloquants.** Seuls `gras` et `corps` portent `bloquant: true`. Un slot non
bloquant n'entre ni dans le score ni dans `complete`, mais **le moteur émet quand même
son étape**, en puisant dans le socle ou en affichant une consigne générique.

**Contrainte protéine-ou-agent-de-brunissement.** Avertissement uniquement, jamais un
blocage. N'influence ni le score ni `complete`.

**Affectation multi-rôles.** Parcours glouton dans l'ordre de déclaration des slots. Un
ingrédient occupe au plus un slot par `moment`. La réutilisation n'est autorisée que vers
un moment hors du feu — `hors_feu` ou `sortie` — et deux slots au maximum.

**Ordonnancement à deux niveaux.** Clé primaire : le `moment` du slot. Clé secondaire :
le tri fin, appliqué à l'intérieur de la phase. Ordre des moments :
`avant_tout · debut = preparation · marquage · base · cuisson · mi_cuisson · oeufs ·
egouttage · sortie · hors_feu`.

**Regroupement, évaporation et repoussement des conserves** : limités à la phase de
mouillage. Sans ce cadrage, le concentré de tomate sort de la phase `base` où il doit
roussir.

**Herbes.** `type_herbe: "dure"` entre dans la phase de mouillage, immédiatement après le
liquide s'il y en a un, en tête de phase sinon. `type_herbe: "tendre"` va hors du feu.
Dans tous les cas, indépendamment du slot occupé.

**Assaisonnement fusionné.** `assaisonnement_sel` ouvre la phase de mouillage au rang −1.
`assaisonnement_acide` absorbe le slot `acide`, `assaisonnement_gras_croquant` absorbe le
slot `finition`. Aucune étape ingrédient distincte n'est émise pour ces deux rôles.
`assaisonnement()` ne sert plus que de filet de sécurité et fournit la table de
rectification.

**Déglaçage.** Marqueur émis quand un ingrédient `liquide: true` entre à la phase de
mouillage et qu'un ingrédient placé plus tôt porte `brunissement` en `requis` ou
`souhaitable`, ou qu'une protéine a été marquée. Placé immédiatement avant le liquide.

**Féculents parallèles.** `riz` et `pates` portent `feculent_parallele: true`. Ils
n'occupent aucun slot. Le moteur émet une étape 0 de mise à chauffer et une étape
d'égouttage avant la phase hors du feu.

**Case « j'ai du temps ».** Passée en option à `choisirStructure`, elle inverse le
départage par `duree_min` et fait remonter la structure `plaque`.

**`liant` est un rôle inerte.** Aucune structure ne déclare de slot `liant`. Ne pas en
ajouter. Idem pour le champ `affinites`.

**La règle d'équilibre de l'écran *Ce soir*** se lit sur le champ `nutrition`, jamais sur
`roles` : les pois chiches sont typés `corps` seul mais comptent comme protéine dans
l'assiette.

**Fonctions pures.** Les quatre modules de `src/engine/` n'importent aucun JSON. Ils
reçoivent `{ catalogue, structures }` en paramètre. C'est `App.jsx` qui fait les imports.

## Contraintes d'interface, pour le Lot 2

Grands caractères. Cibles tactiles de 48 px minimum. Contraste élevé.
Un bouton « je ne sais pas si c'est prêt » sur chaque étape du mode cuisson.
Six taps au maximum entre l'ouverture et la première action en cuisine — l'application
s'ouvre donc directement sur l'écran *Ce soir* une fois le garde-manger configuré.

## Tests

```bash
node scripts/verifier.mjs
```

Aucune dépendance à installer. **Ne pousse jamais sur `main` sans que ce script affiche
« Tous les contrôles passent ».** Ajoute un contrôle pour chaque comportement nouveau.

## Convention de travail

Une branche par lot : `lot-2-interface`, `lot-3-pwa`. `main` ne reçoit que du vert.
Commits en français, à l'impératif, une intention par commit.
