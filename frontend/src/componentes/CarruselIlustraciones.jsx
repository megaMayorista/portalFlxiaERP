import { useEffect, useState } from 'react';
import { DocumentsIllustration, DownloadIllustration, SecurityIllustration } from './Ilustraciones';

const SLIDES = [
  { key: 'documentos', Illustration: DocumentsIllustration, label: 'Sus facturas en un solo lugar' },
  { key: 'descarga', Illustration: DownloadIllustration, label: 'PDF y XML autorizados' },
  { key: 'seguridad', Illustration: SecurityIllustration, label: 'Acceso personal con su RUC o cédula' },
];
const INTERVAL_MS = 5500;

/** Las ilustraciones van cambiando solas; el texto del panel queda fijo. */
export default function IllustrationCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setCurrent((index) => (index + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="flex w-full flex-col items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[44/34] w-full max-w-[460px]">
        {SLIDES.map(({ key, Illustration }, index) => (
          <div
            key={key}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === current ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
            }`}
          >
            <div className="h-full w-full animate-float">
              <Illustration />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Ilustraciones">
        {SLIDES.map(({ key, label }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={index === current}
            aria-label={label}
            title={label}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all ${index === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}
