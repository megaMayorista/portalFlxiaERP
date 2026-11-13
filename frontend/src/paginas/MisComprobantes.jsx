import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiCalendar, FiCheck, FiCopy, FiDownload, FiInbox, FiSearch, FiX } from 'react-icons/fi';
import Field from '../componentes/Campo';
import Pagination from '../componentes/Paginacion';
import { useToast } from '../contexto/AvisosContexto';
import { api, downloadFile } from '../utilidades/api';
import { LIMITS } from '../utilidades/caracteres';
import { DOCUMENT_TYPES, formatDate, formatMoney } from '../utilidades/formato';

const FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INVOICE', label: 'Factura' },
  { value: 'CREDIT_NOTE', label: 'Nota de crédito' },
];

const EMPTY = { items: [], total: 0, page: 1, size: 10, totalPages: 1, unavailableIssuers: [] };

/** Debounced value: the search goes to the API when the person stops typing. */
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function DocumentsPage() {
  const toast = useToast();
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [size, setSize] = useState(10);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounced(search, 350);
  const request = useRef(0);

  // The page belongs to one combination of filters: change any filter and it
  // is page 1 again, in the same render (no extra request for the old page).
  const filterKey = `${type}|${size}|${debouncedSearch.trim()}|${from}|${to}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next) => setPageState({ key: filterKey, page: next });

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ type, page: String(page), size: String(size) });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const result = await api(`/documents?${params.toString()}`);
      if (id === request.current) setData(result);
    } catch (err) {
      if (id === request.current) {
        setData(EMPTY);
        setError(err.message);
      }
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [type, page, size, debouncedSearch, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = Boolean(debouncedSearch.trim() || from || to || type !== 'ALL');
  const clearFilters = () => {
    setSearch('');
    setFrom('');
    setTo('');
    setType('ALL');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Mis comprobantes</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Facturas y notas de crédito electrónicas emitidas a su nombre por los negocios que usan FluxoERP.
          </p>
        </div>
      </div>

      <section className="card p-4 sm:p-5" aria-label="Filtros">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Field
            label="Buscar"
            placeholder="Número, clave de acceso o emisor"
            icon={FiSearch}
            max={LIMITS.search}
            value={search}
            onChange={setSearch}
          />
          <div>
            <label htmlFor="desde" className="mb-1.5 block text-sm font-medium text-ink">Desde</label>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input id="desde" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="input pl-10 lg:w-44" />
            </div>
          </div>
          <div>
            <label htmlFor="hasta" className="mb-1.5 block text-sm font-medium text-ink">Hasta</label>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input id="hasta" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="input pl-10 lg:w-44" />
            </div>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-surface-sunken p-1" role="radiogroup" aria-label="Tipo de comprobante">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={type === option.value}
                onClick={() => setType(option.value)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  type === option.value ? 'bg-surface text-brand shadow-soft' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {filtered && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
              <FiX aria-hidden="true" /> Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {data.unavailableIssuers?.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          No pudimos consultar a {data.unavailableIssuers.join(', ')} en este momento: algunos comprobantes podrían no
          aparecer. Inténtelo de nuevo en unos minutos.
        </p>
      )}

      {error ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <FiAlertTriangle className="text-3xl text-danger" aria-hidden="true" />
          <p className="text-ink">{error}</p>
          <button type="button" onClick={load} className="btn-ghost">Reintentar</button>
        </div>
      ) : (
        <section className="card overflow-hidden" aria-busy={loading} aria-label="Comprobantes">
          {loading && data.items.length === 0 ? (
            <ListSkeleton />
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-2xl text-ink-faint">
                <FiInbox aria-hidden="true" />
              </span>
              <p className="font-semibold text-ink">
                {filtered ? 'Ningún comprobante coincide con la búsqueda.' : 'Todavía no tiene comprobantes autorizados.'}
              </p>
              {filtered && (
                <button type="button" onClick={clearFilters} className="btn-ghost">Ver todos</button>
              )}
            </div>
          ) : (
            <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <DocumentsTable items={data.items} toast={toast} />
              <DocumentCards items={data.items} toast={toast} />
            </div>
          )}
          <div className="border-t px-4 py-3 sm:px-5">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              size={size}
              onPage={(next) => setPage(Math.min(Math.max(next, 1), data.totalPages))}
              onSize={setSize}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function downloadPath(doc, format) {
  return `/documents/${encodeURIComponent(doc.instanceCode)}/${doc.typeUrl}/${doc.accessKey}/${format}`;
}

function TypeBadge({ type }) {
  const invoice = type === 'INVOICE';
  return (
    <span className={`chip ${invoice ? 'bg-brand/10 text-brand' : 'bg-ai/10 text-ai'}`}>
      {DOCUMENT_TYPES[type]?.label || type}
    </span>
  );
}

function DownloadButtons({ doc, toast, compact = false }) {
  const [busy, setBusy] = useState(null);
  const get = async (format) => {
    setBusy(format);
    try {
      await downloadFile(downloadPath(doc, format));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };
  const base = `inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${compact ? 'flex-1' : ''}`;
  return (
    <div className={`flex gap-2 ${compact ? 'w-full' : 'justify-end'}`}>
      <button
        type="button"
        onClick={() => get('pdf')}
        disabled={!doc.hasPdf || busy !== null}
        title={doc.hasPdf ? 'Descargar el RIDE en PDF' : 'Este comprobante no tiene PDF'}
        className={`${base} bg-accent text-white hover:bg-accent-strong`}
      >
        <FiDownload className={busy === 'pdf' ? 'animate-bounce' : ''} aria-hidden="true" /> PDF
      </button>
      <button
        type="button"
        onClick={() => get('xml')}
        disabled={!doc.hasXml || busy !== null}
        title={doc.hasXml ? 'Descargar el XML autorizado' : 'Este comprobante no tiene XML'}
        className={`${base} bg-brand-cyan/15 text-brand-deep hover:bg-brand-cyan/25 dark:text-brand-cyan`}
      >
        <FiDownload className={busy === 'xml' ? 'animate-bounce' : ''} aria-hidden="true" /> XML
      </button>
    </div>
  );
}

function AccessKey({ value, toast }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('No se pudo copiar la clave de acceso.');
    }
  };
  return (
    <span className="flex items-center gap-1.5">
      <span className="truncate font-mono text-[12px] text-ink-muted" title={value}>
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md p-1 text-ink-faint hover:bg-surface-sunken hover:text-ink"
        aria-label="Copiar clave de acceso"
        title="Copiar clave de acceso"
      >
        {copied ? <FiCheck className="text-good" aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      </button>
    </span>
  );
}

function DocumentsTable({ items, toast }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="w-[214px] px-5 py-3">Comprobante</th>
            <th className="px-3 py-3">Emisor</th>
            <th className="w-[104px] px-3 py-3">Fecha</th>
            <th className="px-3 py-3">Clave de acceso</th>
            <th className="w-[112px] px-3 py-3 text-right">Total</th>
            <th className="w-[186px] px-5 py-3 text-right">Descargar</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((doc) => (
            <tr key={`${doc.instanceCode}-${doc.accessKey}`} className="align-middle transition hover:bg-surface-muted/60">
              <td className="px-5 py-3.5">
                <TypeBadge type={doc.type} />
                <p className="mt-1 whitespace-nowrap font-semibold text-ink tabular">{doc.number}</p>
              </td>
              <td className="px-3 py-3.5">
                <p className="truncate font-medium text-ink" title={doc.issuerName}>{doc.issuerName || '—'}</p>
                <p className="text-xs text-ink-faint tabular">{doc.issuerRuc}</p>
              </td>
              <td className="px-3 py-3.5 text-ink-muted tabular">{formatDate(doc.issueDate)}</td>
              <td className="px-3 py-3.5"><AccessKey value={doc.accessKey} toast={toast} /></td>
              <td className="px-3 py-3.5 text-right font-semibold text-ink tabular">{formatMoney(doc.total)}</td>
              <td className="px-5 py-3.5"><DownloadButtons doc={doc} toast={toast} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentCards({ items, toast }) {
  return (
    <ul className="divide-y lg:hidden">
      {items.map((doc) => (
        <li key={`${doc.instanceCode}-${doc.accessKey}`} className="space-y-2.5 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <TypeBadge type={doc.type} />
              <p className="mt-1 whitespace-nowrap font-semibold text-ink tabular">{doc.number}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink tabular">{formatMoney(doc.total)}</p>
              <p className="text-xs text-ink-faint tabular">{formatDate(doc.issueDate)}</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="truncate font-medium text-ink">{doc.issuerName || '—'}</p>
            <p className="text-xs text-ink-faint tabular">RUC {doc.issuerRuc}</p>
          </div>
          <AccessKey value={doc.accessKey} toast={toast} />
          <DownloadButtons doc={doc} toast={toast} compact />
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="h-10 w-32 rounded-lg bg-surface-sunken" />
          <div className="h-10 flex-1 rounded-lg bg-surface-sunken" />
          <div className="hidden h-10 w-48 rounded-lg bg-surface-sunken md:block" />
          <div className="h-8 w-28 rounded-lg bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
