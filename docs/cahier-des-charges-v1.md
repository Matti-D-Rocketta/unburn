# Cahier des charges — V1

**Nom de code** `MOTEUR` · **Périmètre** un utilisateur, trois semaines · **Statut** spécification figée pour le développement

---

## 1. Cadre

**Objectif unique.** Que l'ami testeur cuisine cinq fois en trois semaines, seul, sans poser de question bloquante, et qu'il trouve les plats bons.

**Proposition de valeur.** L'application parle pendant la cuisson. Elle décrit des signaux observables au lieu de durées, elle contraint le garde-manger au lieu de tout accepter, et elle se suffit dans la cuisine sans renvoyer vers une vidéo ou une lecture préalable.

**Critère de succès.** ≥ 4 sessions terminées sur 5 sans question bloquante, et à la question finale « tu commences par quoi et pourquoi ? » le testeur restitue la règle d'ordre.

**Critère d'abandon.** Le testeur ne cuisine que lorsqu'il est sollicité. Le blocage est alors motivationnel et l'application n'y répond pas.

**Non-objectifs V1.** Comptes utilisateurs · backend · synchronisation · application native · appel LLM · calcul nutritionnel chiffré · notation, streak ou gamification · plus de trois structures.

---

## 2. Périmètre fonctionnel

| Élément | Quantité V1 |
|---|---|
| Ingrédients | 30 |
| Structures génératives | 3 — `poelee`, `plaque`, `oeufs` |
| Plat long à texte fixe | 1 — échine de porc au four, 4 portions |
| Signaux sensoriels | ~40 |
| Principes | 10 |
| Écrans | 7 |
| Vidéos de jugement | 6, optionnelles (voir §7) |

---

## 3. Modèle de données

Trois fichiers JSON statiques. C'est l'actif du produit ; l'interface est remplaçable.

### 3.1 `ingredients.json`

```json
{
  "id": "oignon",
  "nom": "Oignon",
  "rayon": "legumes",
  "nutrition": ["fibres"],
  "roles": ["aromatique"],
  "temps_cuisson": "moyen",
  "eau": "rend",
  "brunissement": "souhaitable",
  "etat": "cru",
  "fragile": false,
  "agent_brunissement": true,
  "retirer_apres_marquage": false,
  "type_herbe": null,
  "forme_epice": null,
  "coupe_defaut": "demi-lunes de 3 mm",
  "signal": {
    "vue": "translucide et brillant, les bords commencent à blondir",
    "son_odeur": "le grésillement s'adoucit, l'odeur piquante laisse place à une odeur sucrée",
    "toucher": "la spatule traverse sans résistance"
  },
  "signal_long": "Texte déplié par le bouton « je ne sais pas si c'est prêt ».",
  "video": null,
  "structures": ["poelee", "plaque", "oeufs"],
  "affinites": ["ail", "thym", "carotte"],
  "essentiel_courses": true
}
```

**Vocabulaire contrôlé, à ne pas élargir**
`temps_cuisson` : `court` <5 min · `moyen` 5-15 · `long` >15
`eau` : `rend` · `neutre` · `absorbe`
`brunissement` : `requis` · `souhaitable` · `non`
`etat` : `cru` · `precuit` · `conserve`
`roles` : `gras` · `aromatique` · `roussissement_court` · `proteine` · `corps` · `liant` · `acide` · `finition`
`type_herbe` : `dure` · `tendre` · `null`
`forme_epice` : `entiere` · `moulue` · `null`
`rayon` : `legumes` · `frais` · `boucherie` · `epicerie` · `conserves` · `condiments`

### 3.2 `structures.json`

```json
{
  "id": "poelee",
  "nom": "Poêlée séquencée",
  "duree_min": 20,
  "materiel": ["poêle"],
  "max_ingredients": 6,
  "slots": [
    { "role": "gras",                "min": 1, "max": 1, "moment": "debut" },
    { "role": "proteine",            "min": 0, "max": 1, "moment": "marquage" },
    { "role": "aromatique",          "min": 1, "max": 3, "moment": "base" },
    { "role": "roussissement_court", "min": 0, "max": 2, "moment": "base" },
    { "role": "corps",               "min": 1, "max": 3, "moment": "cuisson" },
    { "role": "acide",               "min": 1, "max": 1, "moment": "hors_feu" },
    { "role": "finition",            "min": 1, "max": 2, "moment": "hors_feu" }
  ],
  "principe": "ordre_par_temps_de_cuisson"
}
```

### 3.3 `principes.json`

`{ "id": "...", "titre": "...", "texte": "3 lignes maximum", "declencheurs": ["role:acide", "structure:poelee"] }`

### 3.4 `plats-fixes.json`

Le plat long, sous forme d'un tableau d'étapes rédigées à la main, sans passage par le moteur.

---

## 4. Moteur

Déterministe, sans réseau, quatre fonctions pures dans `src/engine/`.

**`choisirStructure(selection)`**
Pour chaque structure : score = nombre de slots `min ≥ 1` remplissables, moins une pénalité par ingrédient de la sélection incompatible (`structures` de l'ingrédient), moins une pénalité si `selection.length > max_ingredients`. Retourne les structures triées, celles qui ne remplissent pas tous leurs slots obligatoires étant marquées `incomplete` avec la liste de ce qui manque.

**`ordonnancer(selection, structure)`**
Tri des ingrédients, dans l'ordre :
`gras` → `proteine` si `retirer_apres_marquage` → `aromatique` → `brunissement === "requis"` → `roussissement_court` → `temps_cuisson` décroissant → liquides → réintégration de la protéine retirée → `fragile` → `moment === "hors_feu"`.
Deux règles additionnelles : les ingrédients `eau === "rend"` sont regroupés et déclenchent une étape d'évaporation ; les `etat === "conserve"` sont repoussés en fin de cuisson.

**`genererEtapes(ordonnee, structure)`**
Produit un tableau `{ id, titre, texte, signal, signal_long, video, duree_indicative }`. `duree_indicative` reste masquée derrière un tap : le signal est l'information principale.

**`assaisonnement()`**
Ajoute trois étapes fixes en fin de parcours — sel réparti au fil des couches (rappel), acide hors du feu, gras cru et croquant hors du feu — puis l'écran de rectification :

| Sensation | Correction |
|---|---|
| Fade | Sel |
| Plat, lourd | Acide |
| Agressif, trop salé | Gras ou pointe de sucre |
| Ennuyeux en bouche | Croquant ou herbe fraîche |

**Règle de sécurité culinaire.** Si aucune protéine à marquer n'est retenue, le moteur exige au moins un ingrédient `agent_brunissement: true` et le signale explicitement, faute de quoi le plat sera plat.

---

## 5. Écrans

Navigation par machine à états dans `App.jsx`, sans routeur.

1. **Garde-manger** — les 30 ingrédients, cochables, persistants. Configuré une fois. Accès à la liste de courses.
2. **Liste de courses** — dérivée d'`ingredients.json`, groupée par `rayon`, filtrée sur `essentiel_courses`. Bouton de copie en texte brut.
3. **Ce soir** — uniquement les ingrédients cochés au garde-manger. Sélection de 3 à 6. Règle d'équilibre affichée en dur : une protéine, un corps, un aromatique, un élément frais. Raccourci « comme la dernière fois ».
4. **Propositions** — 2 ou 3 structures, une ligne chacune, plus le plat long lorsqu'il est compatible et que l'utilisateur a coché « j'ai du temps ».
5. **Cuisson** — une étape par écran. Grands caractères, `wakeLock` actif, bandeau permanent de la règle d'ordre, bouton **« je ne sais pas si c'est prêt »** qui déplie `signal_long` et la vidéo si elle existe, timer optionnel.
6. **Rectification** — arbre de goûtage, une sensation par bouton.
7. **Débrief** — trois boutons (réussi / correct / raté), un champ libre « qu'est-ce qui t'a bloqué ? », puis un principe unique.

**Exigence d'ergonomie.** Six taps maximum entre l'ouverture de l'application et la première action en cuisine. À mesurer, pas à estimer.

---

## 6. Instrumentation et export

Toutes les données restent locales. `src/lib/journal.js` enregistre par session : date, structure retenue, ingrédients, identifiants des étapes où « je ne sais pas si c'est prêt » a été tapé, résultat déclaré, texte libre. Un compteur d'exécutions par structure est tenu **dès la V1**, même si le retrait de l'aide n'est pas encore actif.

Un bouton **« exporter mes données »** dans le garde-manger copie le journal en JSON dans le presse-papier. Sans backend, c'est le seul moyen de récupérer ce que l'appareil du testeur a enregistré. Il conditionne toute la suite du projet.

---

## 7. Contenu à écrire — hors code

Le développement produit une base de 30 ingrédients avec des signaux **marqués `BROUILLON`**. Ces textes n'ont aucune valeur tant qu'ils ne sont pas réécrits.

**Gabarit d'un signal** — trois modalités obligatoires, aucune durée employée seule :
> **Vue** ce qui change · **Son ou odeur** ce qui change · **Toucher** ce que donne la pointe du couteau ou la spatule

**Six vidéos de jugement**, cinq secondes chacune, filmées au téléphone, placées dans `public/signaux/`. Elles montrent une décision, jamais un geste : sucs prêts à déglacer · concentré de tomate à point · oignon translucide contre oignon coloré · frémissement correct · viande qui cède · réduction suffisante. Optionnelles au lancement : les taps sur « je ne sais pas si c'est prêt » diront lesquelles tourner en premier.

---

## 8. Architecture technique

**Stack.** React 18 + Vite + JavaScript + Tailwind. Aucune dépendance au-delà de React, Vite, Tailwind. Données JSON importées statiquement. État persistant en `localStorage`. PWA installable, fonctionnement hors ligne intégral. Dépôt GitHub, déploiement Vercel ou Netlify.

**Arborescence — 26 fichiers.**

```
moteur/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ .gitignore
├─ README.md
├─ public/
│  ├─ manifest.json
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ signaux/            (6 vidéos, ajoutées plus tard)
└─ src/
   ├─ main.jsx
   ├─ App.jsx             (machine à états, navigation)
   ├─ index.css
   ├─ data/
   │  ├─ ingredients.json
   │  ├─ structures.json
   │  ├─ principes.json
   │  └─ plats-fixes.json
   ├─ engine/
   │  ├─ choisirStructure.js
   │  ├─ ordonnancer.js
   │  ├─ genererEtapes.js
   │  └─ assaisonnement.js
   ├─ screens/
   │  ├─ GardeManger.jsx
   │  ├─ ListeCourses.jsx
   │  ├─ CeSoir.jsx
   │  ├─ Propositions.jsx
   │  ├─ Cuisson.jsx
   │  ├─ Rectification.jsx
   │  └─ Debrief.jsx
   ├─ components/
   │  ├─ EtapeCard.jsx
   │  ├─ SignalSensoriel.jsx
   │  ├─ BandeauOrdre.jsx
   │  └─ Timer.jsx
   └─ lib/
      ├─ stockage.js
      ├─ journal.js
      └─ ajouterIngredient.js
```

**`ajouterIngredient.js`** est le point d'entrée unique par lequel un ingrédient rejoint la base. En V1 il reçoit des tags saisis à la main. En V2, un LLM produira ces mêmes tags depuis un nom d'ingrédient ou une photo. Le LLM ne rédigera jamais de consigne de cuisson : il traduit un ingrédient en tags, le moteur déterministe fait le reste. Dix lignes aujourd'hui, l'intégration entière plus tard sans rien casser.

---

## 9. Exigences non fonctionnelles

- Fonctionnement complet hors ligne, aucun appel réseau.
- Écran maintenu allumé pendant le mode cuisson (`navigator.wakeLock`, dégradation silencieuse si indisponible).
- Cibles tactiles ≥ 48 px, texte des étapes ≥ 20 px, contraste élevé — l'application est consultée à distance, avec les mains sales.
- Chargement initial < 2 s sur 4G.
- Aucune donnée ne quitte l'appareil.

---

## 10. Préparé pour la suite, inactif en V1

- Compteur d'exécutions par structure → alimentera le retrait progressif de l'aide.
- Champ `video` sur chaque signal → prêt à recevoir les fichiers.
- `ajouterIngredient.js` isolé → point d'entrée du LLM.
- Journal exportable → matière première des versions suivantes.

---

## 11. Tests d'acceptation

1. Sélection `poulet + oignon + courgette + citron` → le moteur propose `poelee`, place l'oignon avant la courgette, le citron hors du feu, et déclenche l'étape d'évaporation pour la courgette.
2. Sélection sans protéine → le moteur exige un agent de brunissement et l'explique.
3. Sélection `œufs + oignon + persil` → `oeufs` proposée, persil placé hors du feu.
4. Une herbe `dure` entre avec le liquide, une herbe `tendre` hors du feu, dans tous les cas.
5. Mode avion activé → l'application fonctionne intégralement.
6. Parcours complet chronométré : ≤ 6 taps jusqu'à la première action.
7. L'export du journal produit un JSON valide contenant les taps « je ne sais pas si c'est prêt ».