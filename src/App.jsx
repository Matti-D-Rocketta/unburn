import { useEffect, useState } from 'react';
import ingredients from './data/ingredients.json';
import GardeManger from './screens/GardeManger.jsx';
import CeSoir from './screens/CeSoir.jsx';
import {
  lireGardeManger,
  ecrireGardeManger,
  lireDerniereSelection,
  ecrireDerniereSelection,
} from './lib/stockage.js';

const ECRANS = { GARDE_MANGER: 'garde_manger', CE_SOIR: 'ce_soir' };

export default function App() {
  const [gardeManger, setGardeManger] = useState(() => lireGardeManger());
  const [ecran, setEcran] = useState(() =>
    lireGardeManger().length > 0 ? ECRANS.CE_SOIR : ECRANS.GARDE_MANGER
  );

  // Figée à l'ouverture : c'est le point de retour du bouton « comme la dernière fois ».
  const [derniereSelection] = useState(() => lireDerniereSelection());
  const [selection, setSelection] = useState(() =>
    lireDerniereSelection().filter((id) => lireGardeManger().includes(id))
  );

  useEffect(() => {
    ecrireGardeManger(gardeManger);
    // Un ingrédient décoché au garde-manger sort aussi de la sélection du soir.
    setSelection((sel) => sel.filter((id) => gardeManger.includes(id)));
  }, [gardeManger]);

  useEffect(() => {
    ecrireDerniereSelection(selection);
  }, [selection]);

  if (ecran === ECRANS.GARDE_MANGER) {
    return (
      <GardeManger
        catalogue={ingredients}
        selection={gardeManger}
        onChange={setGardeManger}
        onValider={() => setEcran(ECRANS.CE_SOIR)}
      />
    );
  }

  return (
    <CeSoir
      catalogue={ingredients}
      gardeManger={gardeManger}
      selection={selection}
      onChange={setSelection}
      derniereSelection={derniereSelection}
      onModifierGardeManger={() => setEcran(ECRANS.GARDE_MANGER)}
    />
  );
}
