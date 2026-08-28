import { DUREE_INDICATIVE } from './choisirStructure.js';
import { MODELES } from './assaisonnement.js';

const SIGNAL_VIDE = {
  vue: 'BROUILLON — à décrire',
  son_odeur: 'BROUILLON — à décrire',
  toucher: 'BROUILLON — à décrire',
};

function duree(ing) {
  return DUREE_INDICATIVE[ing?.temps_cuisson] ?? 3;
}

function etapeIngredient(e, n) {
  const i = e.ingredient;
  const mesure = i.liquide
    ? ' Vise en dessous plutôt qu\'au-dessus : on peut toujours en rajouter.'
    : '';
  return {
    id: `e${n}_${i.id}_${e.moment}`,
    titre: `${i.nom}`,
    texte: `BROUILLON — ${i.coupe_defaut ? i.coupe_defaut + '. ' : ''}Ajoute ${i.nom.toLowerCase()}.${mesure}`,
    signal: i.signal,
    signal_long: i.signal_long,
    video: i.video,
    duree_indicative: duree(i),
    moment: e.moment,
    role: e.role,
    ingredient_id: i.id,
    type: 'ingredient',
  };
}

function etapeMarqueur(e, n) {
  const base = { moment: e.moment, video: null, type: e.type, ingredient_id: e.ingredient?.id ?? null };

  const noms = (e.ingredients || []).map((i) => i.nom.toLowerCase()).join(', ');

  switch (e.type) {
    case 'assaisonnement_sel':
    case 'assaisonnement_acide':
    case 'assaisonnement_gras_croquant': {
      const m = MODELES[e.type];
      const absorbes = e.ingredients || [];
      // Signal propre de l'ingrédient quand un seul est absorbé (arbitrage Lot 2, point 2
      // de questions-ouvertes.md) ; gabarit générique sinon, et toujours pour le sel.
      const signalPropre =
        e.type !== 'assaisonnement_sel' && absorbes.length === 1 ? absorbes[0] : null;
      return {
        ...base,
        id: `e${n}_${e.type}`,
        titre: m.titre,
        texte: m.texte(noms, !!e.depuis_socle),
        signal: signalPropre ? signalPropre.signal : m.signal,
        signal_long: signalPropre ? signalPropre.signal_long : m.signal_long,
        duree_indicative: m.duree_indicative,
        ingredients_ids: absorbes.map((i) => i.id),
      };
    }

    case 'deglacage':
      return {
        ...base,
        id: `e${n}_deglacage`,
        titre: 'Déglace le fond',
        texte: `BROUILLON — Verse ${e.ingredient.nom.toLowerCase()} sur le fond brun et gratte à la spatule pendant que ça bout. Si le liquide contient de l'alcool, attends que l'odeur piquante ait disparu avant d'ajouter le reste.`,
        signal: {
          vue: 'BROUILLON — le fond brun se dissout dans le liquide, qui fonce ; le métal réapparaît nu',
          son_odeur: 'BROUILLON — un sifflement violent à l\'arrivée, puis un bouillonnement franc ; l\'odeur devient ronde',
          toucher: 'BROUILLON — la spatule passée au fond ne rencontre plus aucune aspérité',
        },
        signal_long:
          'BROUILLON — texte long : les sucs collés au fond sont le goût du plat, ils ne se décollent qu\'à l\'ébullition.',
        duree_indicative: 2,
      };

    case 'feculent_depart':
      return {
        ...base,
        id: `e${n}_feculent_depart`,
        titre: 'Mets la casserole à chauffer',
        texte: `BROUILLON — Remplis une casserole d'eau, sale-la franchement, mets-la sur le feu maintenant. ${e.ingredient.nom} y iront plus tard.`,
        signal: {
          vue: "BROUILLON — de grosses bulles remontent en continu et cassent la surface",
          son_odeur: "BROUILLON — le bruit devient sourd et régulier, une vapeur franche monte",
          toucher: "BROUILLON — le couvercle est trop chaud pour la main nue",
        },
        signal_long: "BROUILLON — texte long : l'eau est le seul élément qu'on ne peut pas rattraper, elle part en premier.",
        duree_indicative: duree(e.ingredient),
      };

    case 'feculent_egouttage':
      return {
        ...base,
        id: `e${n}_feculent_egouttage`,
        titre: `Égoutte ${e.ingredient.nom.toLowerCase()}`,
        texte: "BROUILLON — Garde une louche d'eau de cuisson avant d'égoutter, puis égoutte.",
        signal: {
          vue: "BROUILLON — plus d'eau au fond du récipient, la surface des grains est mate",
          son_odeur: "BROUILLON — la vapeur s'échappe d'un coup puis retombe",
          toucher: "BROUILLON — la masse ne colle pas encore en bloc",
        },
        signal_long: "BROUILLON — texte long : à quoi sert l'eau de cuisson gardée de côté.",
        duree_indicative: 2,
      };

    case 'evaporation':
      return {
        ...base,
        id: `e${n}_evaporation`,
        titre: "Laisse partir l'eau",
        texte: `BROUILLON — Ne remue pas, ne couvre pas. Attends que l'eau rendue par ${e.ingredients.map((i) => i.nom.toLowerCase()).join(', ')} soit partie avant de chercher la couleur.`,
        signal: {
          vue: "BROUILLON — le fond de la poêle est sec, plus aucune flaque entre les morceaux",
          son_odeur: "BROUILLON — le bouillonnement sourd redevient un grésillement clair",
          toucher: "BROUILLON — la spatule racle un fond sec, elle n'écarte plus de liquide",
        },
        signal_long: "BROUILLON — texte long : tant qu'il reste de l'eau, la température plafonne et rien ne dore.",
        duree_indicative: 5,
      };

    case 'reintegration':
      return {
        ...base,
        id: `e${n}_reintegration`,
        titre: `Remets ${e.ingredient.nom.toLowerCase()}`,
        texte: `BROUILLON — Remets ${e.ingredient.nom.toLowerCase()} dans la poêle, avec le jus qui a coulé dans l'assiette.`,
        signal: {
          vue: "BROUILLON — la viande se réchauffe sans recolorer, le jus se mêle au reste",
          son_odeur: "BROUILLON — un grésillement bref à l'arrivée puis un bruit calme",
          toucher: "BROUILLON — le morceau coupé n'est plus rosé au centre et reste souple",
        },
        signal_long: "BROUILLON — texte long : réintégrer, ce n'est pas recuire — quelques instants suffisent.",
        duree_indicative: 3,
      };

    case 'retourner':
      return {
        ...base,
        id: `e${n}_retourner`,
        titre: 'Sors la plaque et retourne',
        texte: "BROUILLON — Sors la plaque, retourne les morceaux, remets au four. Si la plaque est chargée, répartis sur deux plaques maintenant.",
        signal: {
          vue: "BROUILLON — la face posée est dorée, la face du dessus est encore pâle",
          son_odeur: "BROUILLON — un grésillement à l'ouverture du four, une odeur rôtie franche",
          toucher: "BROUILLON — la spatule décolle le morceau sans arracher la face dorée",
        },
        signal_long: "BROUILLON — texte long : une seule couche, aucun morceau qui en chevauche un autre.",
        duree_indicative: 2,
      };

    case 'slot_vide':
      return {
        ...base,
        id: `e${n}_slot_vide_${e.role}`,
        titre: `Il manque un élément : ${e.role}`,
        texte: `BROUILLON — Aucun ingrédient de rôle « ${e.role} » ce soir. Consigne générique à rédiger.`,
        signal: SIGNAL_VIDE,
        signal_long: 'BROUILLON — texte long à rédiger.',
        duree_indicative: 1,
      };

    default:
      return null;
  }
}

/** Produit le tableau d'étapes. `duree_indicative` reste masquée derrière un tap côté interface. */
export function genererEtapes(ordonnee, structure, _options = {}) {
  const etapes = [];
  ordonnee.forEach((e, k) => {
    const etape = e.type === 'ingredient' ? etapeIngredient(e, k + 1) : etapeMarqueur(e, k + 1);
    if (etape) etapes.push(etape);
  });
  return etapes;
}
