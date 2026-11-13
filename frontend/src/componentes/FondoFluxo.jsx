/**
 * Fondos de marca de Fluxo, los mismos recursos visuales de flxia.net:
 * malla de líneas finísimas y tres auroras (azul = datos, violeta = IA,
 * naranja = acción) que derivan muy despacio. Decorativos: no reciben clics y
 * con "reducir movimiento" quedan quietos (regla global en estilos.css).
 */

/** Para las pantallas con sesión: tenue, sobre la superficie clara u oscura. */
export function PortalBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="grid-hairline absolute inset-x-0 top-0 h-[70vh]" />
      <div className="absolute -left-[12%] -top-[22%] h-[50vmax] w-[50vmax] animate-drift rounded-full bg-brand/[0.10] blur-3xl" />
      <div className="absolute -right-[16%] top-[28%] h-[42vmax] w-[42vmax] animate-drift-slow rounded-full bg-ai/[0.08] blur-3xl" />
      <div className="absolute -bottom-[24%] left-[20%] hidden h-[44vmax] w-[44vmax] animate-drift rounded-full bg-accent/[0.07] blur-3xl sm:block" />
    </div>
  );
}

/** Escenario oscuro de marca (ingreso, recuperar, 403, 404): siempre noche. */
export function StageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid-hairline-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,#000_20%,transparent_70%)]" />
      <div className="absolute -left-[10%] -top-[20%] h-[55vmax] w-[55vmax] animate-drift rounded-full bg-[#2563eb]/30 blur-3xl" />
      <div className="absolute -right-[18%] top-[18%] h-[48vmax] w-[48vmax] animate-drift-slow rounded-full bg-[#7c3aed]/25 blur-3xl" />
      <div className="absolute -bottom-[30%] left-[25%] h-[45vmax] w-[45vmax] animate-drift rounded-full bg-[#02ceff]/15 blur-3xl" />
      <div className="absolute bottom-[8%] right-[6%] h-40 w-40 rounded-full bg-[#f0643b]/25 blur-3xl" />
    </div>
  );
}
