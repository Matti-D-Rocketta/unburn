import { useMemo } from 'react';
import { choisirStructure } from '../engine/choisirStructure.js';

const NOM_ROLE = {
  gras: 'gras',
  proteine: 'protéine',
  aromatique: 'aromatique',
  roussissement_court: 'roussissement court',
  corps: 'corps',
  liquide: 'liquide',
  acide: 'acide',
  finition: 'finition',
};

export default function Propositions({
  catalogue,
  structures,
  selection,
  jaiDuTemps,
  onChangeJaiDuTemps,
  platLong,
  onChoisirStructure,
  onChoisirPlatLong,
  onRetour,
}) {
  const classement = useMemo(
    () => choisirStructure(selection, { catalogue, structures, temps_declare: jaiDuTemps }),
    [catalogue, structures, selection, jaiDuTemps]
  );

  // Compatibilité du plat long : `compatible_si.temps_declare` seul, sans comparaison
  // au garde-manger (l'échine de porc est `selectionnable: false`) — décision Lot 2.
  const platLongCompatible = jaiDuTemps && platLong.compatible_si.temps_declare === true;
  const ingredientsPlatLong = platLong.ingredients
    .map((id) => catalogue.find((i) => i.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-neutral-900 px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Propositions</h1>

      <button
        type="button"
        onClick={() => onChangeJaiDuTemps(!jaiDuTemps)}
        aria-pressed={jaiDuTemps}
        className={`w-full min-h-[48px] px-4 py-3 mb-6 rounded-lg text-lg font-semibold border-2 ${
          jaiDuTemps
            ? 'bg-neutral-900 text-white border-neutral-900'
            : 'bg-white text-neutral-900 border-neutral-400'
        }`}
      >
        {jaiDuTemps ? '☑' : '☐'} J'ai du temps
      </button>

      <div className="space-y-6 mb-6">
        {classement.map((c) => (
          <div key={c.id} className="border-2 border-neutral-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{c.nom}</h2>
              {c.incomplete && (
                <span className="text-sm font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800">
                  incomplète
                </span>
              )}
            </div>
            <p className="text-base text-neutral-600 mb-3">{c.duree_min} min</p>

            {c.incomplete && (
              <p className="text-base text-amber-800 mb-3">
                Manque : {c.manquants.map((m) => NOM_ROLE[m.role] || m.role).join(', ')}
              </p>
            )}

            {c.avertissements.map((a) => (
              <p key={a.code} className="text-base text-neutral-600 mb-2">
                {a.texte}
              </p>
            ))}

            <button
              type="button"
              onClick={() => onChoisirStructure(c.id)}
              disabled={c.incomplete}
              className="w-full min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold bg-emerald-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              Choisir
            </button>
          </div>
        ))}

        {platLongCompatible && (
          <div className="border-2 border-neutral-300 rounded-lg p-4">
            <h2 className="text-2xl font-bold mb-2">{platLong.nom}</h2>
            <p className="text-base text-neutral-600 mb-3">
              {platLong.duree_min} min · {platLong.portions} portions
            </p>
            <p className="text-base text-neutral-600 mb-3">
              Vérifie que tu as : {ingredientsPlatLong.map((i) => i.nom_defini ?? i.nom).join(', ')}.
            </p>
            <button
              type="button"
              onClick={onChoisirPlatLong}
              className="w-full min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold bg-emerald-700 text-white"
            >
              Choisir
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRetour}
        className="w-full min-h-[48px] px-4 py-3 rounded-lg text-lg text-neutral-700 border-2 border-neutral-300 bg-white"
      >
        Retour à Ce soir
      </button>
    </div>
  );
}
