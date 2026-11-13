import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

/** Hasta 5 páginas visibles alrededor de la actual: « ‹ 3 4 [5] 6 7 › » */
function pageWindow(current, total) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({ page, totalPages, total, size, onPage }) {
  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);
  const cell =
    'inline-flex h-9 min-w-[38px] items-center justify-center border-y border-r px-2 text-sm font-semibold transition first:rounded-l-lg first:border-l last:rounded-r-lg disabled:cursor-not-allowed disabled:text-ink-faint/60';

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-ink-muted tabular">
        <strong className="font-semibold text-ink">{total}</strong> {total === 1 ? 'documento' : 'documentos'}
        {total > 0 && (
          <span className="text-ink-faint">
            {' '}· Mostrando {first}-{last}
          </span>
        )}
      </p>
      {totalPages > 1 && (
        <nav className="flex" aria-label="Paginación">
          <button type="button" className={`${cell} text-ink-muted hover:bg-surface-sunken`} onClick={() => onPage(1)} disabled={page <= 1} aria-label="Primera página">
            <FiChevronsLeft aria-hidden="true" />
          </button>
          <button type="button" className={`${cell} text-ink-muted hover:bg-surface-sunken`} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
            <FiChevronLeft aria-hidden="true" />
          </button>
          {pageWindow(page, totalPages).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`${cell} tabular ${item === page ? 'border-navy bg-navy text-white' : 'text-ink hover:bg-surface-sunken'}`}
            >
              {item}
            </button>
          ))}
          <button type="button" className={`${cell} text-ink-muted hover:bg-surface-sunken`} onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
            <FiChevronRight aria-hidden="true" />
          </button>
          <button type="button" className={`${cell} text-ink-muted hover:bg-surface-sunken`} onClick={() => onPage(totalPages)} disabled={page >= totalPages} aria-label="Última página">
            <FiChevronsRight aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
