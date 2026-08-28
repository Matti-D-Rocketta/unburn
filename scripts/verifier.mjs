import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { choisirStructure } from '../src/engine/choisirStructure.js';
import { ordonnancer } from '../src/engine/ordonnancer.js';
import { genererEtapes } from '../src/engine/genererEtapes.js';
import { assaisonnement } from '../src/engine/assaisonnement.js';

const ici = dirname(fileURLToPath(import.meta.url));
const lire = (f) => JSON.parse(readFileSync(join(ici, '..', 'src', 'data', f), 'utf8'));

const catalogue = lire('ingredients.json');
const structures = lire('structures.json');
const data = { catalogue, structures };

let echecs = 0;
const ok = (c, m) => {
  console.log(`   ${c ? '✓' : '✗'} ${m}`);
  if (!c) echecs++;
};
const titre = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

const pipeline = (selection) => {
  const classement = choisirStructure(selection, data);
  const gagnante = classement[0];
  const seq = ordonnancer(selection, gagnante.structure, { catalogue });
  const { etapes, rectification } = assaisonnement(genererEtapes(seq, gagnante.structure));
  return { classement, gagnante, seq, etapes, rectification };
};

// Les marqueurs (déglaçage, égouttage…) référencent un ingrédient sans être une étape
// d'ingrédient : on ne cherche que parmi les étapes de type `ingredient`.
const estIng = (e, id) => e.type === 'ingredient' && e.ingredient_id === id;
const posEtape = (etapes, id) => etapes.findIndex((e) => estIng(e, id));
const etapeDe = (etapes, id) => etapes.find((e) => estIng(e, id));
const absorbe = (etapes, id) => etapes.find((e) => (e.ingredients_ids || []).includes(id));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\x1b[1m\x1b[4mMOTEUR — Lot 1, tests d\'acceptation 1 à 4\x1b[0m');
console.log(`Catalogue : ${catalogue.length} entrées ` +
  `(${catalogue.filter(i => i.selectionnable).length} sélectionnables, ` +
  `${catalogue.filter(i => i.base).length} socle, ` +
  `${catalogue.filter(i => !i.selectionnable && !i.base).length} hors garde-manger)`);

// ─── Test 1 ──────────────────────────────────────────────────────────────────
titre('Test 1 — poulet + oignon + courgette + citron');
{
  const sel = ['poulet_haut_cuisse', 'oignon', 'courgette', 'citron'];
  const { classement, gagnante, etapes } = pipeline(sel);

  console.log('   classement : ' + classement
    .map((c) => `${c.id}(score ${c.score}${c.complete ? '' : ', incomplète'})`).join('  ·  '));
  console.log('   séquence   :');
  etapes.forEach((e, k) => console.log(
    `     ${String(k + 1).padStart(2)}. [${e.moment.padEnd(11)}] ${e.titre}`
  ));

  ok(gagnante.id === 'poelee', 'la structure retenue est `poelee`');
  const iOignon = posEtape(etapes, 'oignon');
  const iCourgette = posEtape(etapes, 'courgette');
  ok(iOignon >= 0 && iCourgette >= 0 && iOignon < iCourgette, 'l\'oignon est placé avant la courgette');
  ok(absorbe(etapes, 'citron')?.type === 'assaisonnement_acide', 'le citron est absorbé par l\'étape acide, hors du feu');
  const citron = catalogue.find((i) => i.id === 'citron');
  ok(absorbe(etapes, 'citron')?.signal === citron.signal, 'l\'étape acide porte le signal propre du citron, seul ingrédient absorbé');
  const evap = etapes.find((e) => e.type === 'evaporation');
  ok(!!evap && evap.texte.includes('courgette'), 'une étape d\'évaporation est déclenchée pour la courgette');
  ok(!etapes.some((e) => e.type === 'ingredient' && e.moment === 'cuisson' && e.ingredient_id === 'oignon'),
    'l\'oignon n\'est pas regroupé dans la phase de cuisson malgré `eau: rend`');
  ok(etapeDe(etapes, 'huile_olive')?.moment === 'debut' && !!absorbe(etapes, 'huile_olive'),
    'le socle a rempli `gras` (étape propre) et `finition` (absorbé)');
  ok(etapes.filter((e) => e.moment === 'hors_feu').length === 2,
    'la phase hors du feu ne compte plus que deux étapes');
}

// ─── Test 2 ──────────────────────────────────────────────────────────────────
titre('Test 2 — sélection sans protéine ni agent de brunissement');
{
  const sel = ['courgette', 'ail', 'citron'];
  const { classement, gagnante } = pipeline(sel);
  const av = gagnante.avertissements.find((a) => a.code === 'brunissement_absent');

  console.log('   classement : ' + classement
    .map((c) => `${c.id}(score ${c.score}${c.complete ? '' : ', incomplète'})`).join('  ·  '));
  console.log(`   avertissement : ${av ? av.texte : '—'}`);
  console.log(`   suggestions   : ${av ? av.suggestions.join(', ') : '—'}`);

  ok(!!av, 'un avertissement de brunissement est émis');
  ok(av?.bloquant === false, 'l\'avertissement ne bloque pas la génération');
  ok((av?.suggestions.length ?? 0) >= 3, 'des agents de brunissement sont suggérés');

  const avecAgent = choisirStructure(['courgette', 'ail', 'citron', 'oignon'], data)[0];
  ok(!avecAgent.avertissements.some((a) => a.code === 'brunissement_absent'),
    'l\'ajout d\'un agent de brunissement (oignon) éteint l\'avertissement');

  const avecProteine = choisirStructure(['courgette', 'citron', 'steak_hache'], data)[0];
  ok(!avecProteine.avertissements.some((a) => a.code === 'brunissement_absent'),
    'une protéine à marquer éteint aussi l\'avertissement');
}

// ─── Test 3 ──────────────────────────────────────────────────────────────────
titre('Test 3 — œufs + oignon + persil');
{
  const sel = ['oeufs', 'oignon', 'persil_plat'];
  const { classement, gagnante, etapes } = pipeline(sel);

  console.log('   classement : ' + classement
    .map((c) => `${c.id}(score ${c.score}${c.complete ? '' : ', incomplète'})`).join('  ·  '));
  console.log('   séquence   :');
  etapes.forEach((e, k) => console.log(
    `     ${String(k + 1).padStart(2)}. [${e.moment.padEnd(11)}] ${e.titre}`
  ));

  ok(gagnante.id === 'oeufs', 'la structure retenue est `oeufs`');
  ok(absorbe(etapes, 'persil_plat')?.moment === 'hors_feu', 'le persil est hors du feu');
  ok(posEtape(etapes, 'oeufs') > posEtape(etapes, 'oignon'), 'les œufs arrivent après la garniture');
  ok(classement.find((c) => c.id === 'poelee').incomplete, '`poelee` est marquée incomplète (aucun corps)');
}

// ─── Test 4 ──────────────────────────────────────────────────────────────────
titre('Test 4 — herbe dure avec le liquide, herbe tendre hors du feu');
{
  const sel = ['poulet_haut_cuisse', 'oignon', 'carotte', 'thym', 'bouillon_volaille', 'persil_plat'];
  const { gagnante, etapes } = pipeline(sel);

  console.log(`   structure  : ${gagnante.id}`);
  console.log('   séquence   :');
  etapes.forEach((e, k) => console.log(
    `     ${String(k + 1).padStart(2)}. [${e.moment.padEnd(11)}] ${e.titre}`
  ));

  const iBouillon = posEtape(etapes, 'bouillon_volaille');
  const iThym = posEtape(etapes, 'thym');
  ok(etapeDe(etapes, 'thym')?.moment === 'cuisson', 'le thym (herbe dure) est dans la phase de cuisson');
  ok(iThym === iBouillon + 1, 'le thym entre immédiatement après le liquide');
  ok(absorbe(etapes, 'persil_plat')?.moment === 'hors_feu', 'le persil (herbe tendre) est hors du feu');
  ok(etapeDe(etapes, 'carotte')?.moment === 'cuisson' && posEtape(etapes, 'carotte') < iBouillon && !!absorbe(etapes, 'carotte'),
    'la carotte (temps long) entre avant le liquide');

  // Cas sans liquide : l'herbe dure prend la tête de la phase de cuisson.
  const sel2 = ['poulet_haut_cuisse', 'oignon', 'courgette', 'thym', 'citron'];
  const r2 = pipeline(sel2);
  const idxThym = posEtape(r2.etapes, 'thym');
  const cuisson = r2.etapes.filter((e) => e.moment === 'cuisson');
  const cuissonIng = cuisson.filter((e) => e.type === 'ingredient');
  ok(r2.etapes[idxThym]?.moment === 'cuisson' && cuissonIng[0]?.ingredient_id === 'thym',
    'sans liquide, l\'herbe dure ouvre les ingrédients de la phase de cuisson');
}

// ─── Contrôles de cohérence des données ──────────────────────────────────────
titre('Contrôles de cohérence des données');
{
  const sel = catalogue.filter((i) => i.selectionnable);
  ok(sel.length === 30, `30 ingrédients sélectionnables (trouvé ${sel.length})`);
  ok(catalogue.filter((i) => i.base).length === 4, 'socle de 4 ingrédients');

  const champsSignal = catalogue.flatMap((i) => [i.signal.vue, i.signal.son_odeur, i.signal.toucher, i.signal_long]);
  ok(champsSignal.every((t) => t.startsWith('BROUILLON — ')), `tous les signaux sont préfixés BROUILLON (${champsSignal.length} champs)`);

  const vocab = {
    temps_cuisson: ['court', 'moyen', 'long'],
    eau: ['rend', 'neutre', 'absorbe'],
    brunissement: ['requis', 'souhaitable', 'non'],
    etat: ['cru', 'precuit', 'conserve'],
    rayon: ['legumes', 'frais', 'boucherie', 'epicerie', 'conserves', 'condiments'],
  };
  const roles = ['gras', 'aromatique', 'roussissement_court', 'proteine', 'corps', 'liant', 'acide', 'finition', 'liquide'];
  let vocabOk = true;
  for (const i of catalogue) {
    for (const [champ, valeurs] of Object.entries(vocab)) if (!valeurs.includes(i[champ])) { vocabOk = false; console.log(`     ↳ ${i.id}.${champ} = ${i[champ]}`); }
    if (!i.roles.every((r) => roles.includes(r))) { vocabOk = false; console.log(`     ↳ ${i.id}.roles = ${i.roles}`); }
    if (![null, 'dure', 'tendre'].includes(i.type_herbe)) vocabOk = false;
    if (![null, 'entiere', 'moulue'].includes(i.forme_epice)) vocabOk = false;
  }
  ok(vocabOk, 'le vocabulaire contrôlé est respecté partout');

  const couvert = (test) => catalogue.some(test);
  ok(couvert((i) => i.forme_epice === 'entiere') && couvert((i) => i.forme_epice === 'moulue'), 'épices entière et moulue présentes');
  ok(couvert((i) => i.type_herbe === 'dure') && couvert((i) => i.type_herbe === 'tendre'), 'herbes dure et tendre présentes');
  ok(couvert((i) => i.etat === 'precuit') && couvert((i) => i.eau === 'absorbe'), 'états `precuit` et `absorbe` présents');
  ok(catalogue.filter((i) => i.liquide).length === 2, 'deux liquides déclarés');
  ok(catalogue.filter((i) => i.feculent_parallele).length === 2, 'deux féculents parallèles déclarés');

  const ids = new Set(catalogue.map((i) => i.id));
  ok(catalogue.every((i) => i.affinites.every((a) => ids.has(a))), 'toutes les affinités pointent vers un id existant');

  // Chaque structure praticable au moins deux fois avec des sélections plausibles.
  const essais = {
    poelee: [['poulet_haut_cuisse', 'oignon', 'courgette', 'citron'], ['lardons_fumes', 'champignons_paris', 'ail', 'persil_plat']],
    plaque: [['pomme_terre', 'chou_fleur', 'thym', 'citron'], ['poulet_haut_cuisse', 'poivron_rouge', 'paprika_fume', 'yaourt_grec']],
    oeufs: [['oeufs', 'oignon', 'persil_plat'], ['oeufs', 'epinards_frais', 'feta']],
  };
  for (const [sid, jeux] of Object.entries(essais)) {
    const complet = jeux.filter((j) => choisirStructure(j, data).find((c) => c.id === sid)?.complete).length;
    const rangs = jeux.map((j) => choisirStructure(j, data).findIndex((c) => c.id === sid) + 1);
    ok(complet === 2, `\`${sid}\` est complète sur ses 2 sélections d'essai (rangs proposés : ${rangs.join(', ')})`);
  }
}

// ─── Points 5 et 6 ───────────────────────────────────────────────────────────
titre('Déglaçage et rôle `liquide`');
{
  const a = pipeline(['poulet_haut_cuisse', 'oignon', 'bouillon_volaille']);
  a.etapes.forEach((e, k) => console.log(`     ${String(k + 1).padStart(2)}. [${e.moment.padEnd(11)}] ${e.titre}`));
  const iDeg = a.etapes.findIndex((e) => e.type === 'deglacage');
  const iBou = posEtape(a.etapes, 'bouillon_volaille');
  ok(iDeg >= 0, 'le déglaçage apparaît sur poulet + oignon + bouillon');
  ok(iDeg === iBou - 1, 'le déglaçage est placé immédiatement avant le liquide');
  ok(a.etapes[iBou]?.texte.includes('en dessous'), 'l\'étape du liquide porte la consigne de dosage');

  const b = pipeline(['courgette', 'citron']);
  ok(!b.etapes.some((e) => e.type === 'deglacage'), 'aucun déglaçage sur courgette + citron');

  const c = choisirStructure(['bouillon_volaille', 'oignon'], data);
  console.log('   bouillon + oignon : ' + c.map((x) => `${x.id}(${x.complete ? 'complète' : 'incomplète'})`).join('  ·  '));
  ok(!c.find((x) => x.id === 'poelee').complete, '« bouillon + oignon » ne sort plus une poêlée complète');
  const d = choisirStructure(['tomates_concassees', 'oignon', 'ail'], data);
  ok(d.find((x) => x.id === 'poelee').complete, 'les tomates concassées remplissent toujours `corps`');
}

// ─── Point 2 ─────────────────────────────────────────────────────────────────
titre('Case « j\'ai du temps »');
{
  const sel = ['pomme_terre', 'chou_fleur', 'thym', 'citron'];
  const sans = choisirStructure(sel, data)[0].id;
  const avec = choisirStructure(sel, { ...data, temps_declare: true })[0].id;
  console.log(`   sans la case : ${sans}   ·   avec la case : ${avec}`);
  ok(sans === 'poelee', 'sans la case, la durée courte gagne');
  ok(avec === 'plaque', 'avec la case, `plaque` passe devant');
}

// ─── Point 4 ─────────────────────────────────────────────────────────────────
titre('Avertissement d\'ingrédient non utilisé');
{
  const r = choisirStructure(['pomme_terre', 'chou_fleur', 'paprika_fume', 'citron'], data);
  const av = r.find((x) => x.id === 'plaque').avertissements.find((a) => a.code === 'ingredients_non_utilises');
  console.log(`   ${av ? av.texte : '—'}`);
  ok(!!av, 'le paprika est signalé comme non utilisé sur plaque');
  ok(av?.details?.[0]?.ailleurs.length > 0, 'l\'avertissement indique où il aurait sa place');
}

// ─── Féculent parallèle ──────────────────────────────────────────────────────
titre('Contrôle supplémentaire — féculent parallèle');
{
  const { etapes } = pipeline(['poulet_haut_cuisse', 'oignon', 'courgette', 'citron', 'riz']);
  etapes.forEach((e, k) => console.log(`     ${String(k + 1).padStart(2)}. [${e.moment.padEnd(11)}] ${e.titre}`));
  ok(etapes[0]?.type === 'feculent_depart', 'l\'eau du riz est lancée en toute première étape');
  const iEg = etapes.findIndex((e) => e.type === 'feculent_egouttage');
  const iHF = etapes.findIndex((e) => e.moment === 'hors_feu');
  ok(iEg >= 0 && iEg < iHF, 'l\'égouttage précède la phase hors du feu');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n\x1b[1m${echecs === 0 ? '\x1b[32mTous les contrôles passent.' : `\x1b[31m${echecs} contrôle(s) en échec.`}\x1b[0m`);
process.exit(echecs === 0 ? 0 : 1);
