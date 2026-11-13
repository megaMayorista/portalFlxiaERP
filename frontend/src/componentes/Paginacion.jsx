import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Pages to show around the current one: 1 … 4 5 [6] 7 8 … 20 */
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
    result.push(page);
  });
  return result;
}

export const PAGE_SIZES = [10, 25, 50];

export default function Pagination({ page, totalPages, total, size, onPage, onSize }) {
  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);
  const button =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-semibold transition disabled:opacity-40';

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-ink-muted tabular">
        {total === 0 ? 'Sin documentos' : (
          <>
            Mostrando <strong className="text-ink">{first}–{last}</strong> de{' '}
            <strong className="text-ink">{total}</strong> {total === 1 ? 'documento' : 'documentos'}
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="hidden sm:inline">Por página</span>
          <select
            value={size}
            onChange={(event) => onSize(Number(event.target.value))}
            className="rounded-lg border bg-surface px-2 py-1.5 text-sm text-ink"
            aria-label="Documentos por página"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <nav className="flex items-center gap-1" aria-label="Paginación">
          <button
            type="button"
            className={`${button} text-ink-muted hover:bg-surface-sunken`}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <FiChevronLeft aria-hidden="true" />
          </button>
          {pageList(page, totalPages).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="px-1 text-ink-faint">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPage(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`${button} tabular ${item === page ? 'bg-brand text-white' : 'text-ink-muted hover:bg-surface-sunken'}`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${button} text-ink-muted hover:bg-surface-sunken`}
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <FiChevronRight aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}
