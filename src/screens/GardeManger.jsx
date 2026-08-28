const ORDRE_RAYONS = ['legumes', 'frais', 'boucherie', 'epicerie', 'conserves', 'condiments'];
const NOM_RAYON = {
  legumes: 'Légumes',
  frais: 'Frais',
  boucherie: 'Boucherie',
  epicerie: 'Épicerie',
  conserves: 'Conserves',
  condiments: 'Condiments',
};

export default function GardeManger({ catalogue, selection, onChange, onValider }) {
  const groupes = ORDRE_RAYONS.map((rayon) => ({
    rayon,
    ingredients: catalogue.filter((i) => i.selectionnable && i.rayon === rayon),
  })).filter((g) => g.ingredients.length > 0);

  const estCoche = (id) => selection.includes(id);
  const basculer = (id) => {
    onChange(estCoche(id) ? selection.filter((s) => s !== id) : [...selection, id]);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Garde-manger</h1>
      <p className="text-lg mb-6">
        Coche ce que tu as chez toi. Tu pourras revenir ici à tout moment.
      </p>

      {groupes.map(({ rayon, ingredients }) => (
        <section key={rayon} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-neutral-700">{NOM_RAYON[rayon]}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ingredients.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => basculer(i.id)}
                  aria-pressed={estCoche(i.id)}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-lg text-lg text-left border-2 ${
                    estCoche(i.id)
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-900 border-neutral-400'
                  }`}
                >
                  {i.nom}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-lg mb-4">
        {selection.length} ingrédient{selection.length > 1 ? 's' : ''} coché
        {selection.length > 1 ? 's' : ''}
      </p>

      <button
        type="button"
        onClick={onValider}
        disabled={selection.length === 0}
        className="w-full min-h-[48px] px-6 py-3 rounded-lg text-xl font-semibold bg-emerald-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        Valider et passer à Ce soir
      </button>
    </div>
  );
}
