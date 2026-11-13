/**
 * Isotipo oficial de Fluxo (la F azul con el detalle naranja) y la marca en
 * texto con el mismo degradado del ala: #004a8b → #018bc9 → #02ceff.
 */
export default function Logo({ size = 'md', subtitle = true, onDark = false }) {
  const big = size === 'lg';
  return (
    <span className="inline-flex items-center gap-3">
      <img
        src="/marca/logo-fluxo.png"
        alt=""
        aria-hidden="true"
        width={big ? 48 : 36}
        height={big ? 48 : 36}
        className={big ? 'h-12 w-12' : 'h-9 w-9'}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-bold tracking-tight ${big ? 'text-2xl' : 'text-lg'} ${
            onDark ? 'text-white' : 'bg-gradient-to-r from-brand-deep via-brand-sky to-brand-cyan bg-clip-text text-transparent dark:from-brand-sky dark:via-brand-cyan dark:to-white'
          }`}
        >
          FluxoIA
        </span>
        {subtitle && (
          <span className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${onDark ? 'text-white/70' : 'text-ink-faint'}`}>
            Portal de Descargas
          </span>
        )}
      </span>
    </span>
  );
}
