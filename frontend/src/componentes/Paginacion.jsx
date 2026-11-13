import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

/** Hasta 5 páginas visibles alrededor de la actual. */
function pageWindow(current, total) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Paginación en píldora: ← Anterior · 1 2 [3] 4 5 · Siguiente → */
export default function Pagination({ page, totalPages, total, size, onPage }) {
  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);
  const step =
    'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-muted transition hover:bg-surface-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-ink-muted tabular">
        Mostrando <strong className="text-ink">{first}–{last}</strong> de <strong className="text-ink">{total}</strong>{' '}
        {total === 1 ? 'documento' : 'documentos'}
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1 rounded-full border bg-surface p-1 shadow-soft" aria-label="Paginación">
          <button type="button" className={step} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
            <FiArrowLeft aria-hidden="true" /> <span className="hidden sm:inline">Anterior</span>
          </button>
          {pageWindow(page, totalPages).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition tabular ${
                item === page ? 'bg-gradient-to-br from-brand to-brand-sky text-white shadow-brand' : 'text-ink hover:bg-surface-sunken'
              }`}
            >
              {item}
            </button>
          ))}
          <button type="button" className={step} onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
            <span className="hidden sm:inline">Siguiente</span> <FiArrowRight aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
