export const RECTIFICATION = [
  { sensation: 'Fade', correction: 'Sel', texte: 'BROUILLON — une pincée, remue, regoûte avant d\'en remettre.' },
  { sensation: 'Plat, lourd', correction: 'Acide', texte: 'BROUILLON — quelques gouttes de jus ou de vinaigre, hors du feu.' },
  { sensation: 'Agressif, trop salé', correction: 'Gras ou pointe de sucre', texte: 'BROUILLON — un filet d\'huile crue, ou une pincée de sucre.' },
  { sensation: 'Ennuyeux en bouche', correction: 'Croquant ou herbe fraîche', texte: 'BROUILLON — quelque chose de cru posé sur le plat servi.' },
];

/**
 * Les trois étapes fixes ne sont plus ajoutées en fin de parcours : elles sont émises
 * en place par `genererEtapes` à partir des marqueurs posés par `ordonnancer`.
 *  - `assaisonnement_sel` ouvre la phase de mouillage ;
 *  - `assaisonnement_acide` absorbe le slot `acide` ;
 *  - `assaisonnement_gras_croquant` absorbe le slot `finition`.
 * Ce module fournit les gabarits et la table de rectification.
 */
export const MODELES = {
  assaisonnement_sel: {
    titre: 'Sale maintenant, et à chaque ajout',
    texte: () =>
      "BROUILLON — Une pincée sur ce qui est déjà dans la poêle, puis une pincée à chaque nouvel ajout. Le sel ajouté à la fin reste en surface.",
    signal: {
      vue: 'BROUILLON — les légumes brillent et rendent leur eau plus vite',
      son_odeur: 'BROUILLON — le grésillement se charge, l\'odeur monte franchement',
      toucher: 'BROUILLON — goûter : la saveur doit arriver devant, pas après trois secondes',
    },
    signal_long:
      'BROUILLON — texte long : saler par couches contre saler à la fin, même quantité, résultat différent.',
    duree_indicative: 1,
  },
  assaisonnement_acide: {
    titre: 'L\'acide, feu coupé',
    texte: (noms, socle) =>
      socle
        ? `BROUILLON — Coupe le feu. Quelques gouttes de ${noms}, remue une fois. Ne remets pas sur le feu.`
        : `BROUILLON — Coupe le feu. Ajoute ${noms}, remue une fois. Ne remets pas sur le feu.`,
    signal: {
      vue: 'BROUILLON — le liquide disparaît en quelques secondes, il ne stagne pas en surface',
      son_odeur: 'BROUILLON — l\'odeur se redresse d\'un cran, le piquant retombe aussitôt',
      toucher: 'BROUILLON — goûter : le plat paraît plus salé sans avoir ajouté de sel',
    },
    signal_long:
      'BROUILLON — texte long : ce que l\'acide corrige exactement, et pourquoi la chaleur le détruit.',
    duree_indicative: 1,
  },
  assaisonnement_gras_croquant: {
    titre: 'Le gras cru et le croquant',
    texte: (noms) =>
      noms
        ? `BROUILLON — Hors du feu, sur le plat servi : ${noms}.`
        : "BROUILLON — Hors du feu, un filet de gras cru et quelque chose de croquant ou de frais sur le plat servi.",
    signal: {
      vue: 'BROUILLON — le filet reste visible en surface, il ne se dilue pas',
      son_odeur: 'BROUILLON — une odeur nouvelle et fraîche se superpose à celle de la cuisson',
      toucher: 'BROUILLON — sous la dent, un contraste net avec le reste du plat',
    },
    signal_long: 'BROUILLON — texte long : pourquoi un plat homogène en texture ennuie la bouche.',
    duree_indicative: 1,
  },
};

/**
 * Filet de sécurité : garantit la présence des trois étapes fixes dans le parcours
 * et fournit la table de rectification. N'ajoute rien si elles sont déjà en place.
 */
export function assaisonnement(etapes = []) {
  const presents = new Set(etapes.map((e) => e.type));
  const manquantes = Object.keys(MODELES)
    .filter((t) => !presents.has(t))
    .map((t) => ({
      id: t,
      type: t,
      moment: 'hors_feu',
      titre: MODELES[t].titre,
      texte: MODELES[t].texte('', false),
      signal: MODELES[t].signal,
      signal_long: MODELES[t].signal_long,
      video: null,
      duree_indicative: MODELES[t].duree_indicative,
      ingredient_id: null,
      ingredients_ids: [],
    }));

  return { etapes: [...etapes, ...manquantes], rectification: RECTIFICATION };
}
