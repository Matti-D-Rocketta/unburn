import { RANG_MOMENT, MOMENTS_HORS_FEU, affecterSlots } from './choisirStructure.js';

const RANG_TEMPS = { long: 0.0, moyen: 0.1, court: 0.2 };

function momentsDe(structure) {
  return new Set(structure.slots.map((s) => s.moment));
}

/** Moment de mouillage de la structure : là où entrent les liquides et les herbes dures. */
function momentMouillage(structure) {
  const m = momentsDe(structure);
  if (m.has('cuisson')) return 'cuisson';
  if (m.has('preparation')) return 'preparation';
  return structure.slots[0].moment;
}

function momentHorsFeu(structure) {
  const m = momentsDe(structure);
  if (m.has('hors_feu')) return 'hors_feu';
  if (m.has('sortie')) return 'sortie';
  return structure.slots[structure.slots.length - 1].moment;
}

/** Tri fin du §4, appliqué à l'intérieur d'une phase. */
function rangFin(entree, phase) {
  const i = entree.ingredient;
  let r;

  if (entree.role === 'gras') r = 0;
  else if (entree.role === 'proteine' && i.retirer_apres_marquage) r = 1;
  else if (i.liquide) r = 6;
  else if (entree.role === 'aromatique') r = 2;
  else if (i.brunissement === 'requis') r = 3;
  else if (entree.role === 'roussissement_court') r = 4;
  else r = 5 + (RANG_TEMPS[i.temps_cuisson] ?? 0.1);

  // Les conserves sont repoussées en fin de cuisson (§4), à l'intérieur de la phase `cuisson` seulement.
  if (phase === 'cuisson' && i.etat === 'conserve') r += 20;
  // Les fragiles ferment toujours leur phase.
  if (i.fragile) r += 40;

  return r;
}

/**
 * Retourne la séquence ordonnée. Chaque entrée est
 *   { type: 'ingredient', ingredient, role, moment }
 * ou un marqueur
 *   { type: 'evaporation' | 'reintegration' | 'retourner' | 'slot_vide' | 'feculent_depart' | 'feculent_egouttage', moment, ... }
 */
export function ordonnancer(selection, structure, { catalogue }) {
  const { affectations, slotsVides, feculents } = affecterSlots(selection, structure, catalogue);

  const mouillage = momentMouillage(structure);
  const horsFeu = momentHorsFeu(structure);
  const moments = momentsDe(structure);

  const entrees = affectations.map((a) => ({
    type: 'ingredient',
    ingredient: a.ingredient,
    role: a.role,
    moment: a.moment,
  }));

  // --- Surcharges de moment -------------------------------------------------

  for (const e of entrees) {
    const i = e.ingredient;
    // Herbes : règle absolue du test 4, indépendante du slot occupé.
    if (i.type_herbe === 'dure') e.moment = mouillage;
    if (i.type_herbe === 'tendre') e.moment = horsFeu;
    // Plaque : ce qui est court ou fragile bascule à mi-cuisson.
    if (
      moments.has('preparation') &&
      e.moment === 'preparation' &&
      (i.temps_cuisson === 'court' || i.fragile === true) &&
      e.role !== 'gras'
    ) {
      e.moment = 'mi_cuisson';
    }
  }

  // --- Marqueurs ------------------------------------------------------------

  const marqueurs = [];

  // Point 3a : le sel s'enseigne pendant la cuisson, pas une fois le plat servi.
  marqueurs.push({ type: 'assaisonnement_sel', moment: mouillage, rangFin: -1 });

  // Points 3b et 3c : les slots `acide` et `finition` sont absorbés par les deux étapes
  // d'assaisonnement. Aucune étape ingrédient distincte n'est émise pour eux.
  const absorbes = { acide: [], finition: [] };
  const restants = [];
  for (const e of entrees) {
    if (e.role === 'acide' || e.role === 'finition') absorbes[e.role].push(e.ingredient);
    else restants.push(e);
  }
  entrees.length = 0;
  entrees.push(...restants);

  const acideSocle = catalogue.find((i) => i.base && i.roles.includes('acide'));
  marqueurs.push({
    type: 'assaisonnement_acide',
    moment: horsFeu,
    ingredients: absorbes.acide.length ? absorbes.acide : [acideSocle].filter(Boolean),
    depuis_socle: absorbes.acide.length === 0,
    rangFin: 90,
  });
  marqueurs.push({
    type: 'assaisonnement_gras_croquant',
    moment: horsFeu,
    ingredients: absorbes.finition,
    rangFin: 91,
  });

  // Une protéine n'est réintégrée que si elle a effectivement été retirée, donc si la
  // structure possède un moment `marquage`. Sur plaque, rien n'est sorti du four.
  const aRetirer = entrees.find(
    (e) => e.role === 'proteine' && e.ingredient.retirer_apres_marquage && e.moment === 'marquage'
  );
  if (aRetirer) {
    marqueurs.push({
      type: 'reintegration',
      moment: mouillage,
      ingredient: aRetirer.ingredient,
      rangFin: 30,
    });
  }

  if (moments.has('preparation')) {
    marqueurs.push({ type: 'retourner', moment: 'mi_cuisson', rangFin: -100 });
  }

  for (const f of feculents) {
    marqueurs.push({ type: 'feculent_depart', moment: 'avant_tout', ingredient: f, rangFin: 0 });
    marqueurs.push({ type: 'feculent_egouttage', moment: 'egouttage', ingredient: f, rangFin: 0 });
  }

  for (const s of slotsVides) {
    if (s.min >= 1 && !s.bloquant && s.role !== 'acide' && s.role !== 'finition') {
      marqueurs.push({ type: 'slot_vide', moment: s.moment, role: s.role, rangFin: 50 });
    }
  }

  // --- Tri ------------------------------------------------------------------

  const toutes = [...entrees, ...marqueurs];
  for (const e of toutes) {
    if (e.rangFin === undefined) e.rangFin = rangFin(e, e.moment);
  }

  // Une herbe dure entre avec le liquide : on la recale juste après le dernier liquide de sa phase,
  // ou en tête de phase s'il n'y a aucun liquide.
  const liquidesMouillage = toutes.filter(
    (e) => e.type === 'ingredient' && e.moment === mouillage && e.ingredient.liquide
  );
  for (const e of toutes) {
    if (e.type !== 'ingredient' || e.ingredient.type_herbe !== 'dure') continue;
    e.rangFin = liquidesMouillage.length
      ? Math.max(...liquidesMouillage.map((l) => l.rangFin)) + 0.01
      : 0.5; // tête de phase, mais jamais devant le gras (rang 0)
  }

  toutes.sort((a, b) => {
    const ma = RANG_MOMENT[a.moment] ?? 99;
    const mb = RANG_MOMENT[b.moment] ?? 99;
    if (ma !== mb) return ma - mb;
    return a.rangFin - b.rangFin;
  });

  // Déglaçage : un liquide qui arrive sur un fond où quelque chose a coloré. Placé
  // immédiatement avant le liquide (point 5).
  const iLiquide = toutes.findIndex(
    (e) => e.type === 'ingredient' && e.moment === mouillage && e.ingredient.liquide
  );
  if (iLiquide > -1) {
    const avant = toutes.slice(0, iLiquide).filter((e) => e.type === 'ingredient');
    const sucs = avant.some(
      (e) =>
        ['requis', 'souhaitable'].includes(e.ingredient.brunissement) ||
        (e.role === 'proteine' && e.moment === 'marquage')
    );
    if (sucs) {
      toutes.splice(iLiquide, 0, {
        type: 'deglacage',
        moment: mouillage,
        ingredient: toutes[iLiquide].ingredient,
      });
    }
  }

  // Étape d'évaporation : après le dernier ingrédient `eau: "rend"` de la phase de cuisson.
  // Une herbe dure placée juste derrière le liquide fait partie du mouillage : on la garde
  // en amont de la réduction.
  const idxRend = [];
  toutes.forEach((e, k) => {
    if (e.type === 'ingredient' && e.moment === mouillage && e.ingredient.eau === 'rend') idxRend.push(k);
  });
  if (idxRend.length) {
    let dernier = idxRend[idxRend.length - 1];
    while (
      toutes[dernier + 1] &&
      toutes[dernier + 1].type === 'ingredient' &&
      toutes[dernier + 1].moment === mouillage &&
      toutes[dernier + 1].ingredient.type_herbe === 'dure'
    ) {
      dernier += 1;
    }
    toutes.splice(dernier + 1, 0, {
      type: 'evaporation',
      moment: mouillage,
      ingredients: idxRend.map((k) => toutes[k].ingredient),
    });
  }

  return toutes;
}

export { MOMENTS_HORS_FEU };
