import Presentation from '../components/Presentation.jsx';

const MIN_SELECTION = 3;
const MAX_SELECTION = 6;

export default function CeSoir({
  catalogue,
  gardeManger,
  selection,
  onChange,
  derniereSelection,
  onModifierGardeManger,
  onVoirPropositions,
}) {
  const disponibles = catalogue.filter((i) => gardeManger.includes(i.id));
  const dernierValide = derniereSelection.filter((id) => gardeManger.includes(id));

  const estCoche = (id) => selection.includes(id);
  const basculer = (id) => {
    if (estCoche(id)) {
      onChange(selection.filter((s) => s !== id));
    } else if (selection.length < MAX_SELECTION) {
      onChange([...selection, id]);
    }
  };

  const compte = selection.length;
  const valide = compte >= MIN_SELECTION && compte <= MAX_SELECTION;

  if (disponibles.length === 0) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 px-4 py-6">
        <Presentation />
        <h1 className="text-3xl font-bold mb-4">Ce soir</h1>
        <p className="text-lg mb-6">Aucun ingrédient coché au garde-manger.</p>
        <button
          type="button"
          onClick={onModifierGardeManger}
          className="w-full min-h-[48px] px-6 py-3 rounded-lg text-xl font-semibold bg-neutral-900 text-white"
        >
          Aller au garde-manger
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 px-4 py-6">
      <Presentation />
      <h1 className="text-3xl font-bold mb-2">Ce soir</h1>
      <p className="text-lg mb-2">Choisis entre 3 et 6 ingrédients.</p>
      <p className="text-base text-neutral-600 mb-6">
        L'équilibre à viser : une protéine, un légume ou un féculent, un aromatique et un élément frais.
      </p>

      {dernierValide.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(dernierValide)}
          className="w-full min-h-[48px] px-4 py-3 mb-6 rounded-lg text-lg font-semibold border-2 border-neutral-900 text-neutral-900 bg-white"
        >
          Comme la dernière fois
        </button>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {disponibles.map((i) => {
          const coche = estCoche(i.id);
          const desactive = !coche && compte >= MAX_SELECTION;
          return (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => basculer(i.id)}
                disabled={desactive}
                aria-pressed={coche}
                className={`w-full min-h-[48px] px-4 py-3 rounded-lg text-lg text-left border-2 ${
                  coche
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : desactive
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                    : 'bg-white text-neutral-900 border-neutral-400'
                }`}
              >
                {i.nom}
              </button>
            </li>
          );
        })}
      </ul>

      <p className={`text-lg font-semibold mb-4 ${valide ? 'text-emerald-700' : 'text-neutral-600'}`}>
        {compte} / {MAX_SELECTION} sélectionné{compte > 1 ? 's' : ''}
        {valide ? ' — prêt' : ` — encore ${Math.max(0, MIN_SELECTION - compte)} au minimum`}
      </p>

      <button
        type="button"
        onClick={onVoirPropositions}
        disabled={!valide}
        className="w-full min-h-[48px] px-6 py-3 mb-4 rounded-lg text-xl font-semibold bg-emerald-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        Voir les propositions
      </button>

      <button
        type="button"
        onClick={onModifierGardeManger}
        className="w-full min-h-[48px] px-4 py-3 rounded-lg text-lg text-neutral-700 border-2 border-neutral-300 bg-white"
      >
        Modifier le garde-manger
      </button>
    </div>
  );
}
