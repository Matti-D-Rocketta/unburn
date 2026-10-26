import EtapeCard from '../components/EtapeCard.jsx';
import BandeauOrdre from '../components/BandeauOrdre.jsx';

export default function Cuisson({ etapes, indexEtape, onSuivant, onPrecedent, onRetour, bandeauTexte }) {
  const etape = etapes[indexEtape];
  const premiere = indexEtape === 0;
  const derniere = indexEtape === etapes.length - 1;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <BandeauOrdre texte={bandeauTexte} />

      <div className="px-4 pt-4 flex items-center justify-between">
        <button type="button" onClick={onRetour} className="min-h-[48px] px-3 py-2 text-base text-neutral-600">
          ← Retour aux propositions
        </button>
        <p className="text-base text-neutral-500">
          Étape {indexEtape + 1} / {etapes.length}
        </p>
      </div>

      <EtapeCard key={etape.id ?? indexEtape} etape={etape} />

      <div className="px-4 pb-8 flex gap-3">
        {!premiere && (
          <button
            type="button"
            onClick={onPrecedent}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold border-2 border-neutral-400 text-neutral-700 bg-white"
          >
            Étape précédente
          </button>
        )}
        {!derniere ? (
          <button
            type="button"
            onClick={onSuivant}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold bg-emerald-700 text-white"
          >
            Étape suivante
          </button>
        ) : (
          <p className="flex-1 min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold text-center bg-neutral-100 text-neutral-600">
            Dernière étape
          </p>
        )}
      </div>
    </div>
  );
}
