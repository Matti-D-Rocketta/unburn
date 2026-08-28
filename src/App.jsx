import { useEffect, useState } from 'react';
import ingredients from './data/ingredients.json';
import structures from './data/structures.json';
import platsFixes from './data/plats-fixes.json';
import principes from './data/principes.json';
import GardeManger from './screens/GardeManger.jsx';
import CeSoir from './screens/CeSoir.jsx';
import Propositions from './screens/Propositions.jsx';
import Cuisson from './screens/Cuisson.jsx';
import { ordonnancer } from './engine/ordonnancer.js';
import { genererEtapes } from './engine/genererEtapes.js';
import { assaisonnement } from './engine/assaisonnement.js';
import {
  lireGardeManger,
  ecrireGardeManger,
  lireDerniereSelection,
  ecrireDerniereSelection,
} from './lib/stockage.js';

const ECRANS = {
  GARDE_MANGER: 'garde_manger',
  CE_SOIR: 'ce_soir',
  PROPOSITIONS: 'propositions',
  CUISSON: 'cuisson',
};

const platLong = platsFixes[0];
const bandeauOrdre = principes.find((p) => p.id === 'ordre_par_temps');

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

  const [jaiDuTemps, setJaiDuTemps] = useState(false);
  const [etapes, setEtapes] = useState([]);
  const [indexEtape, setIndexEtape] = useState(0);

  useEffect(() => {
    ecrireGardeManger(gardeManger);
    // Un ingrédient décoché au garde-manger sort aussi de la sélection du soir.
    setSelection((sel) => sel.filter((id) => gardeManger.includes(id)));
  }, [gardeManger]);

  useEffect(() => {
    ecrireDerniereSelection(selection);
  }, [selection]);

  const choisirStructureEtCuisiner = (structureId) => {
    const structure = structures.find((s) => s.id === structureId);
    const ordonnee = ordonnancer(selection, structure, { catalogue: ingredients });
    const { etapes: liste } = assaisonnement(genererEtapes(ordonnee, structure));
    setEtapes(liste);
    setIndexEtape(0);
    setEcran(ECRANS.CUISSON);
  };

  const choisirPlatLong = () => {
    setEtapes(platLong.etapes);
    setIndexEtape(0);
    setEcran(ECRANS.CUISSON);
  };

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

  if (ecran === ECRANS.CE_SOIR) {
    return (
      <CeSoir
        catalogue={ingredients}
        gardeManger={gardeManger}
        selection={selection}
        onChange={setSelection}
        derniereSelection={derniereSelection}
        onModifierGardeManger={() => setEcran(ECRANS.GARDE_MANGER)}
        onVoirPropositions={() => setEcran(ECRANS.PROPOSITIONS)}
      />
    );
  }

  if (ecran === ECRANS.PROPOSITIONS) {
    return (
      <Propositions
        catalogue={ingredients}
        structures={structures}
        selection={selection}
        jaiDuTemps={jaiDuTemps}
        onChangeJaiDuTemps={setJaiDuTemps}
        platLong={platLong}
        onChoisirStructure={choisirStructureEtCuisiner}
        onChoisirPlatLong={choisirPlatLong}
        onRetour={() => setEcran(ECRANS.CE_SOIR)}
      />
    );
  }

  return (
    <Cuisson
      etapes={etapes}
      indexEtape={indexEtape}
      onSuivant={() => setIndexEtape((i) => Math.min(i + 1, etapes.length - 1))}
      onPrecedent={() => setIndexEtape((i) => Math.max(i - 1, 0))}
      onRetour={() => setEcran(ECRANS.PROPOSITIONS)}
      bandeauTexte={bandeauOrdre?.titre}
    />
  );
}
