import { useState } from 'react';

export default function SignalSensoriel({ signal, signalLong, video }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="mt-4">
      <dl className="space-y-3 text-lg">
        <div>
          <dt className="font-semibold text-neutral-700">Vue</dt>
          <dd>{signal.vue}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-700">Son ou odeur</dt>
          <dd>{signal.son_odeur}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-700">Toucher</dt>
          <dd>{signal.toucher}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="mt-4 w-full min-h-[48px] px-4 py-3 rounded-lg text-lg font-semibold border-2 border-neutral-900 text-neutral-900 bg-white"
      >
        Je ne sais pas si c'est prêt
      </button>

      {ouvert && (
        <div className="mt-4 text-lg bg-neutral-100 rounded-lg p-4">
          <p>{signalLong}</p>
          {video && <video className="mt-4 w-full rounded-lg" src={video} controls playsInline />}
        </div>
      )}
    </div>
  );
}
