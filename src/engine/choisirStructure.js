// Fonctions pures. Aucune donnée importée : le catalogue et les structures
// sont injectés par l'appelant (App.jsx en runtime, verifier.mjs en test).

/** Rang des moments. `preparation` est au même rang que `debut` (arbitrage A3). */
export const RANG_MOMENT = {
  avant_tout: -1,
  debut: 0,
  preparation: 0,
  marquage: 1,
  base: 2,
  cuisson: 3,
  mi_cuisson: 4,
  oeufs: 5,
  egouttage: 5.5,
  sortie: 6,
  hors_feu: 7,
};

/** Moments considérés « hors du feu » : seuls ceux-ci autorisent la réutilisation d'un ingrédient. */
export const MOMENTS_HORS_FEU = ['hors_feu', 'sortie'];

export const PENALITE_INCOMPATIBLE = -2;
export const PENALITE_DEPASSEMENT = -3;

export const DUREE_INDICATIVE = { court: 3, moyen: 8, long: 20 };

export function indexer(catalogue) {
  const parId = new Map();
  for (const ing of catalogue) parId.set(ing.id, ing);
  return parId;
}

export function socleDe(catalogue) {
  return catalogue.filter((i) => i.base === true);
}

/**
 * Affecte chaque ingrédient à un slot.
 * Règles (arbitrage A2) :
 *  - parcours glouton dans l'ordre de déclaration des slots ;
 *  - un ingrédient occupe au plus un slot par `moment` ;
 *  - la réutilisation d'un ingrédient déjà affecté n'est permise que vers un slot hors du feu ;
 *  - deux slots au maximum par ingrédient ;
 *  - le socle (`base: true`) n'est mobilisé que si le slot reste sous son `min`.
 */
export function affecterSlots(selection, structure, catalogue) {
  const parId = indexer(catalogue);
  const retenus = selection.map((id) => parId.get(id)).filter(Boolean);

  const feculents = retenus.filter((i) => i.feculent_parallele === true);
  const candidats = retenus.filter((i) => i.feculent_parallele !== true);
  const socle = socleDe(catalogue);

  const usage = new Map(); // id -> { nb, moments:Set }
  const peutPrendre = (ing, slot) => {
    const u = usage.get(ing.id);
    if (!u) return true;
    if (u.nb >= 2) return false;
    if (u.moments.has(slot.moment)) return false;
    return MOMENTS_HORS_FEU.includes(slot.moment);
  };
  const marquer = (ing, slot) => {
    const u = usage.get(ing.id) || { nb: 0, moments: new Set() };
    u.nb += 1;
    u.moments.add(slot.moment);
    usage.set(ing.id, u);
  };

  const affectations = [];
  const slotsVides = [];

  for (const slot of structure.slots) {
    const pris = [];

    const puiser = (pool) => {
      for (const ing of pool) {
        if (pris.length >= slot.max) break;
        if (slot.ingredient_impose && ing.id !== slot.ingredient_impose) continue;
        if (!ing.roles.includes(slot.role)) continue;
        if (!peutPrendre(ing, slot)) continue;
        pris.push(ing);
        marquer(ing, slot);
      }
    };

    puiser(candidats);
    if (pris.length < slot.min && !slot.ingredient_impose) puiser(socle);

    for (const ing of pris) {
      affectations.push({ ingredient: ing, role: slot.role, moment: slot.moment, slot });
    }
    if (pris.length < slot.min) {
      slotsVides.push({ role: slot.role, moment: slot.moment, min: slot.min, bloquant: !!slot.bloquant, ingredient_impose: slot.ingredient_impose || null });
    }
  }

  return { affectations, slotsVides, feculents, retenus, candidats };
}

/** Règle de sécurité culinaire du §4, appliquée en avertissement et jamais en blocage (arbitrage B3). */
export function verifierBrunissement(affectations, candidats, catalogue) {
  const proteineAMarquer = affectations.some(
    (a) => a.role === 'proteine' && a.ingredient.brunissement === 'requis'
  );
  if (proteineAMarquer) return null;

  const agent = candidats.some((i) => i.agent_brunissement === true);
  if (agent) return null;

  const suggestions = catalogue
    .filter((i) => i.agent_brunissement === true && i.selectionnable === true)
    .map((i) => i.id)
    .filter((id) => ['concentre_tomate', 'champignons_paris', 'oignon'].includes(id));

  return {
    code: 'brunissement_absent',
    bloquant: false,
    texte:
      "BROUILLON — Aucune protéine à marquer et aucun agent de brunissement : le plat sera plat. Ajoute de quoi colorer.",
    suggestions,
  };
}

/**
 * Score = nombre de slots bloquants (min ≥ 1) effectivement remplis,
 * moins 2 par ingrédient incompatible, moins 3 en cas de dépassement de max_ingredients.
 * Tri : complètes d'abord, puis score décroissant, puis duree_min croissante, puis ordre de déclaration.
 */
export function choisirStructure(selection, { catalogue, structures, temps_declare = false }) {
  const resultats = structures.map((structure, rangDeclaration) => {
    const aff = affecterSlots(selection, structure, catalogue);

    const slotsBloquants = structure.slots.filter((s) => s.bloquant && s.min >= 1);
    const manquants = aff.slotsVides.filter((s) => s.bloquant);
    const remplis = slotsBloquants.length - manquants.length;

    const incompatibles = aff.candidats.filter((i) => !i.structures.includes(structure.id));
    const depassement = selection.length > structure.max_ingredients;

    const score =
      remplis +
      incompatibles.length * PENALITE_INCOMPATIBLE +
      (depassement ? PENALITE_DEPASSEMENT : 0);

    const avertissements = [];
    // La contrainte protéine-ou-agent n'entre ni dans le score ni dans `complete` (arbitrage 1).
    const brun = verifierBrunissement(aff.affectations, aff.candidats, catalogue);
    if (brun) avertissements.push(brun);

    const utilises = new Set(aff.affectations.map((a) => a.ingredient.id));
    const nonAffectes = aff.candidats.filter((i) => !utilises.has(i.id));

    return {
      id: structure.id,
      nom: structure.nom,
      duree_min: structure.duree_min,
      score,
      complete: manquants.length === 0,
      incomplete: manquants.length > 0,
      manquants,
      incompatibles: incompatibles.map((i) => i.id),
      avertissements,
      nonAffectes,
      rangDeclaration,
      structure,
    };
  });

  // Un ingrédient coché qui n'entre dans aucun slot disparaîtrait silencieusement.
  // Toutes les structures étant déjà évaluées, on indique où il aurait sa place.
  const accueilli = new Map(); // id ingrédient -> [noms de structures]
  for (const r of resultats) {
    const util = new Set(
      affecterSlots(selection, r.structure, catalogue).affectations.map((a) => a.ingredient.id)
    );
    for (const id of util) {
      if (!accueilli.has(id)) accueilli.set(id, []);
      accueilli.get(id).push(r.nom);
    }
  }
  for (const r of resultats) {
    if (!r.nonAffectes.length) continue;
    const details = r.nonAffectes.map((i) => ({
      id: i.id,
      nom: i.nom,
      ailleurs: accueilli.get(i.id) || [],
    }));
    const phrases = details.map((d) =>
      d.ailleurs.length
        ? `${d.nom} n'entre pas dans « ${r.nom} », sa place est dans « ${d.ailleurs.join(' » ou « ')} ».`
        : `${d.nom} n'entre dans aucune structure ce soir.`
    );
    r.avertissements.push({
      code: 'ingredients_non_utilises',
      bloquant: false,
      texte: `BROUILLON — ${phrases.join(' ')}`,
      suggestions: details.map((d) => d.id),
      details,
    });
  }
  for (const r of resultats) {
    if (selection.length > r.structure.max_ingredients) {
      r.avertissements.push({
        code: 'trop_d_ingredients',
        bloquant: false,
        texte: `BROUILLON — ${r.nom} tient ${r.structure.max_ingredients} ingrédients au maximum.`,
        suggestions: [],
      });
    }
    delete r.nonAffectes;
  }

  // Départage : complètes d'abord, score décroissant, puis durée. « J'ai du temps » inverse la durée.
  resultats.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    if (a.duree_min !== b.duree_min) {
      return temps_declare ? b.duree_min - a.duree_min : a.duree_min - b.duree_min;
    }
    return a.rangDeclaration - b.rangDeclaration;
  });

  return resultats;
}
