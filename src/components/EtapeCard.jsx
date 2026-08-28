import { useState } from 'react';
import SignalSensoriel from './SignalSensoriel.jsx';

export default function EtapeCard({ etape }) {
  const [dureeVisible, setDureeVisible] = useState(false);

  return (
    <div className="px-4 py-6">
      <h2 className="text-3xl font-bold mb-4">{etape.titre}</h2>
      <p className="text-xl mb-4">{etape.texte}</p>

      <button
        type="button"
        onClick={() => setDureeVisible((v) => !v)}
        aria-expanded={dureeVisible}
        className="min-h-[48px] px-4 py-2 rounded-lg text-base text-neutral-600 border-2 border-neutral-300 bg-white"
      >
        {dureeVisible ? `Environ ${etape.duree_indicative} min` : 'Durée indicative'}
      </button>

      <SignalSensoriel signal={etape.signal} signalLong={etape.signal_long} video={etape.video} />
    </div>
  );
}
