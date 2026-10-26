import { DUREE_INDICATIVE } from './choisirStructure.js';
import { MODELES } from './assaisonnement.js';

// Complète « Pas … ce soir » pour l'étape d'un slot resté vide.
const MANQUE_ROLE = {
  aromatique: "d'aromatique",
  roussissement_court: "d'épice ni de concentré à faire roussir",
  corps: 'de légume ni de féculent',
  proteine: 'de protéine',
  liquide: 'de liquide',
};

const SIGNAL_VIDE = {
  vue: 'rien de nouveau dans la poêle à cette étape',
  son_odeur: "le bruit et l'odeur restent ceux de l'étape précédente",
  toucher: "rien à vérifier : passe à l'étape suivante",
};

/** Nom précédé de son article (« l'oignon », « les pâtes »), pour des phrases complètes. */
export function defini(ing) {
  return ing.nom_defini ?? ing.nom.toLowerCase();
}

function majuscule(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « a », « a et b », « a, b et c ». */
export function enumerer(noms) {
  return noms.length <= 1 ? noms.join('') : `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

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
    texte: `Ajoute ${defini(i)}${i.coupe_defaut ? ` : ${i.coupe_defaut}` : ''}.${mesure}`,
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

  const noms = enumerer((e.ingredients || []).map(defini));

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
        texte: `Verse ${defini(e.ingredient)} sur le fond brun et gratte à la spatule pendant que ça bout. Si le liquide contient de l'alcool, attends que l'odeur piquante ait disparu avant d'ajouter le reste.`,
        signal: {
          vue: 'le fond brun se dissout dans le liquide, qui fonce ; le métal réapparaît nu',
          son_odeur: 'un sifflement violent à l\'arrivée, puis un bouillonnement franc ; l\'odeur devient ronde',
          toucher: 'la spatule passée au fond ne rencontre plus aucune aspérité',
        },
        signal_long:
          'Les sucs collés au fond font le goût du plat. Ils ne se décollent que dans un liquide qui bout.',
        duree_indicative: 2,
      };

    case 'feculent_depart': {
      const nom = defini(e.ingredient);
      return {
        ...base,
        id: `e${n}_feculent_depart`,
        titre: 'Mets la casserole à chauffer',
        texte: `Remplis une casserole d'eau, sale-la franchement et mets-la sur le feu maintenant. ${majuscule(nom)} ${nom.startsWith('les ') ? 'iront' : 'ira'} dedans plus tard.`,
        signal: {
          vue: "de grosses bulles remontent en continu et cassent la surface",
          son_odeur: "le bruit devient sourd et régulier, une vapeur franche monte",
          toucher: "le couvercle est trop chaud pour la main nue",
        },
        signal_long: "L'eau est la seule chose qu'on ne peut pas accélérer : elle part en premier.",
        duree_indicative: duree(e.ingredient),
      };
    }

    case 'feculent_egouttage':
      return {
        ...base,
        id: `e${n}_feculent_egouttage`,
        titre: `Égoutte ${defini(e.ingredient)}`,
        texte: "Garde une louche d'eau de cuisson de côté, puis égoutte.",
        signal: {
          vue: "plus d'eau au fond du récipient, la surface des grains est mate",
          son_odeur: "la vapeur s'échappe d'un coup puis retombe",
          toucher: "la masse ne colle pas encore en bloc",
        },
        signal_long:
          "L'eau de cuisson gardée de côté est chargée d'amidon : quelques cuillerées aident la sauce à lier et à napper.",
        duree_indicative: 2,
      };

    case 'evaporation':
      return {
        ...base,
        id: `e${n}_evaporation`,
        titre: "Laisse partir l'eau",
        texte: `Ne remue pas, ne couvre pas. Attends que l'eau rendue par ${enumerer(e.ingredients.map(defini))} soit partie avant de chercher la couleur.`,
        signal: {
          vue: "le fond de la poêle est sec, plus aucune flaque entre les morceaux",
          son_odeur: "le bouillonnement sourd redevient un grésillement clair",
          toucher: "la spatule racle un fond sec, elle n'écarte plus de liquide",
        },
        signal_long: "Tant qu'il reste de l'eau dans la poêle, la température plafonne et rien ne dore.",
        duree_indicative: 5,
      };

    case 'reintegration':
      return {
        ...base,
        id: `e${n}_reintegration`,
        titre: `Remets ${defini(e.ingredient)}`,
        texte: `Remets ${defini(e.ingredient)} dans la poêle, avec le jus qui a coulé dans l'assiette.`,
        signal: {
          vue: "la viande se réchauffe sans recolorer, le jus se mêle au reste",
          son_odeur: "un grésillement bref à l'arrivée puis un bruit calme",
          toucher: "le morceau coupé n'est plus rosé au centre et reste souple",
        },
        signal_long: "Remettre la viande, ce n'est pas la recuire : quelques instants suffisent à la réchauffer.",
        duree_indicative: 3,
      };

    case 'retourner':
      return {
        ...base,
        id: `e${n}_retourner`,
        titre: 'Sors la plaque et retourne',
        texte: "Sors la plaque, retourne les morceaux et remets-la au four. Si la plaque est chargée, répartis sur deux plaques maintenant.",
        signal: {
          vue: "la face posée est dorée, la face du dessus est encore pâle",
          son_odeur: "un grésillement à l'ouverture du four, une odeur rôtie franche",
          toucher: "la spatule décolle le morceau sans arracher la face dorée",
        },
        signal_long:
          "Une seule couche, aucun morceau qui en chevauche un autre : sinon, les légumes cuisent à la vapeur au lieu de rôtir.",
        duree_indicative: 2,
      };

    case 'slot_vide':
      return {
        ...base,
        id: `e${n}_slot_vide_${e.role}`,
        titre: 'Rien à ajouter ici',
        texte: `Pas ${MANQUE_ROLE[e.role] ?? `d'ingrédient « ${e.role} »`} ce soir : cette étape reste vide, le plat tient quand même. Passe à la suite.`,
        signal: SIGNAL_VIDE,
        signal_long:
          "Cette étape apporte d'habitude du goût de fond. Sans elle, le plat sera plus simple : la prochaine fois, un oignon ou une gousse d'ail suffit à la remplir.",
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
