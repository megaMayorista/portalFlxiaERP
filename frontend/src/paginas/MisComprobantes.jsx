import { useCallback, useEffect, useRef, useState } from 'react';
import { BsFiletypePdf, BsFiletypeXml } from 'react-icons/bs';
import { FiAlertTriangle, FiCheck, FiChevronDown, FiCopy, FiInbox, FiSearch } from 'react-icons/fi';
import Pagination from '../componentes/Paginacion';
import CharCounter from '../componentes/ContadorCaracteres';
import { useToast } from '../contexto/AvisosContexto';
import { api, downloadFile } from '../utilidades/api';
import { LIMITS, countCharacters, guardChange } from '../utilidades/caracteres';
import { DOCUMENT_TYPES, formatDate, formatMoney } from '../utilidades/formato';

const FILTERS = [
  { value: 'ALL', label: 'Todos los documentos' },
  { value: 'INVOICE', label: 'Facturas' },
  { value: 'CREDIT_NOTE', label: 'Notas de crédito' },
];

/** Filas por página: hasta 30 y lo demás va paginado. */
const PAGE_SIZE = 30;

const EMPTY = { items: [], total: 0, page: 1, size: PAGE_SIZE, totalPages: 1, unavailableIssuers: [] };

/** La búsqueda va al API cuando la persona deja de escribir. */
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
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounced(search, 350);
  const request = useRef(0);
  const listTop = useRef(null);

  // La página pertenece a una combinación de filtros: al cambiar un filtro se
  // vuelve a la 1 en el mismo render (sin pedir antes la página vieja).
  const filterKey = `${type}|${debouncedSearch.trim()}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const goToPage = (next) => {
    setPageState({ key: filterKey, page: Math.min(Math.max(next, 1), data.totalPages) });
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ type, page: String(page), size: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
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
  }, [type, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = Boolean(debouncedSearch.trim() || type !== 'ALL');

  return (
    <section ref={listTop} className="card scroll-mt-24 p-3 sm:p-5 lg:p-6" aria-label="Comprobantes recibidos">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(guardChange(event, { mode: 'text', max: LIMITS.search }).value)}
              placeholder="Buscar por fecha, clave de acceso o emisor…"
              aria-label="Buscar por fecha, clave de acceso o emisor"
              spellCheck={false}
              className="input pl-10"
            />
          </div>
          <div className="mt-1">
            <CharCounter length={countCharacters(search)} max={LIMITS.search} />
          </div>
        </div>
        <div className="relative sm:w-60">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Filtro por documento"
            className="input appearance-none pr-10"
          >
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3.5 top-[22px] -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        </div>
      </div>

      {data.unavailableIssuers?.length > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          No pudimos consultar a {data.unavailableIssuers.join(', ')} en este momento: algunos comprobantes podrían no
          aparecer. Inténtelo de nuevo en unos minutos.
        </p>
      )}

      <div className="mt-4" aria-busy={loading}>
        {error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <FiAlertTriangle className="text-3xl text-danger" aria-hidden="true" />
            <p className="text-ink">{error}</p>
            <button type="button" onClick={load} className="btn-ghost">Reintentar</button>
          </div>
        ) : loading && data.items.length === 0 ? (
          <ListSkeleton />
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-2xl text-ink-faint">
              <FiInbox aria-hidden="true" />
            </span>
            <p className="font-semibold text-ink">
              {filtered ? 'Ningún comprobante coincide con la búsqueda.' : 'Todavía no tiene comprobantes autorizados.'}
            </p>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setType('ALL');
                }}
                className="btn-ghost"
              >
                Ver todos
              </button>
            )}
          </div>
        ) : (
          <ul className={`space-y-2.5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((doc) => (
              <DocumentRow key={`${doc.instanceCode}-${doc.accessKey}`} doc={doc} toast={toast} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} size={PAGE_SIZE} onPage={goToPage} />
      </div>
    </section>
  );
}

function downloadPath(doc, format) {
  return `/documents/${encodeURIComponent(doc.instanceCode)}/${doc.typeUrl}/${doc.accessKey}/${format}`;
}

function Labeled({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[11px] text-ink-faint">{label}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

/**
 * Un comprobante como fila-tarjeta. En pantallas anchas todo va en una línea;
 * en tablet y celular se reacomoda en dos columnas (el orden lo dan las clases order-*).
 */
function DocumentRow({ doc, toast }) {
  const invoice = doc.type === 'INVOICE';
  return (
    <li className="rounded-xl border bg-surface px-3.5 py-3 transition hover:border-brand/40 hover:shadow-soft sm:px-4">
      <div className="grid grid-cols-2 items-center gap-x-4 gap-y-3 xl:grid-cols-[minmax(170px,190px)_minmax(0,1.25fr)_100px_minmax(0,1.75fr)_100px_auto]">
        <div className="order-1">
          <div className={`inline-block rounded-lg border px-3 py-1.5 ${invoice ? 'border-brand/25 bg-brand/5' : 'border-ai/25 bg-ai/5'}`}>
            <p className={`text-[11px] font-semibold ${invoice ? 'text-brand' : 'text-ai'}`}>{DOCUMENT_TYPES[doc.type]?.label || doc.type}</p>
            <p className={`whitespace-nowrap font-mono text-[13px] ${invoice ? 'text-brand-strong' : 'text-ai'}`}>{doc.number}</p>
          </div>
        </div>

        <div className="order-2 flex justify-end gap-2 xl:order-6">
          <FileButton doc={doc} format="pdf" toast={toast} />
          <FileButton doc={doc} format="xml" toast={toast} />
        </div>

        <Labeled label="Emisor:" className="order-3 col-span-2 xl:order-2 xl:col-span-1">
          <span className="block truncate" title={`${doc.issuerRuc || ''} - ${doc.issuerName || ''}`}>
            <span className="tabular">{doc.issuerRuc}</span> - {doc.issuerName || '—'}
          </span>
        </Labeled>

        <Labeled label="Fecha:" className="order-4 xl:order-3">
          <span className="tabular">{formatDate(doc.issueDate)}</span>
        </Labeled>

        <Labeled label="Total:" className="order-5 text-right xl:text-left">
          <span className="font-semibold tabular">{formatMoney(doc.total)}</span>
        </Labeled>

        <Labeled label="Clave de Acceso:" className="order-6 col-span-2 xl:order-4 xl:col-span-1">
          <AccessKey value={doc.accessKey} toast={toast} />
        </Labeled>
      </div>
    </li>
  );
}

function FileButton({ doc, format, toast }) {
  const [busy, setBusy] = useState(false);
  const pdf = format === 'pdf';
  const available = pdf ? doc.hasPdf : doc.hasXml;

  const get = async () => {
    setBusy(true);
    try {
      await downloadFile(downloadPath(doc, format));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const Icon = pdf ? BsFiletypePdf : BsFiletypeXml;
  return (
    <button
      type="button"
      onClick={get}
      disabled={!available || busy}
      title={available ? (pdf ? 'Descargar el RIDE en PDF' : 'Descargar el XML autorizado') : `Este comprobante no tiene ${pdf ? 'PDF' : 'XML'}`}
      aria-label={pdf ? `Descargar PDF de ${doc.number}` : `Descargar XML de ${doc.number}`}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border bg-surface text-2xl transition hover:-translate-y-0.5 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:shadow-none ${
        pdf ? 'border-red-300 text-red-600 dark:border-red-400/40 dark:text-red-400' : 'border-blue-300 text-blue-600 dark:border-blue-400/40 dark:text-blue-400'
      } ${busy ? 'animate-pulse' : ''}`}
    >
      <Icon aria-hidden="true" />
    </button>
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
    <span className="flex items-start gap-1.5">
      <span className="break-all font-mono text-[11.5px] leading-snug text-ink-muted">{value}</span>
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

function ListSkeleton() {
  return (
    <ul className="space-y-2.5" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <li key={row} className="flex animate-pulse items-center gap-4 rounded-xl border px-4 py-4">
          <div className="h-11 w-40 rounded-lg bg-surface-sunken" />
          <div className="h-9 flex-1 rounded-lg bg-surface-sunken" />
          <div className="hidden h-9 w-64 rounded-lg bg-surface-sunken xl:block" />
          <div className="h-11 w-24 rounded-lg bg-surface-sunken" />
        </li>
      ))}
    </ul>
  );
}
