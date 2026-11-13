import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCopy,
  FiDownload,
  FiFileMinus,
  FiFileText,
  FiLayers,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import CharCounter from '../componentes/ContadorCaracteres';
import { DocumentsIllustration } from '../componentes/Ilustraciones';
import Pagination from '../componentes/Paginacion';
import { useToast } from '../contexto/AvisosContexto';
import { useSession } from '../contexto/SesionContexto';
import { api, downloadFile } from '../utilidades/api';
import { LIMITS, countCharacters, guardChange } from '../utilidades/caracteres';
import { DOCUMENT_TYPES, formatDate, formatMoney, titleCase } from '../utilidades/formato';

/** Hasta 30 comprobantes por página; lo demás va paginado. */
const PAGE_SIZE = 30;

const EMPTY = {
  items: [],
  total: 0,
  page: 1,
  size: PAGE_SIZE,
  totalPages: 1,
  unavailableIssuers: [],
  documentCount: 0,
  invoiceCount: 0,
  creditNoteCount: 0,
  lastIssueDate: null,
};

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
  const { user } = useSession();
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
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
      if (id === request.current) {
        setData(result);
        setLoaded(true);
      }
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
  const chips = [
    { value: 'ALL', label: 'Todos', count: data.documentCount, icon: FiLayers },
    { value: 'INVOICE', label: 'Facturas', count: data.invoiceCount, icon: FiFileText },
    { value: 'CREDIT_NOTE', label: 'Notas de crédito', count: data.creditNoteCount, icon: FiFileMinus },
  ];

  return (
    <div className="space-y-6">
      <Hero name={user.fullName} data={data} loaded={loaded} />

      <div ref={listTop} className="flex scroll-mt-24 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de comprobante">
          {chips.map(({ value, label, count, icon: Icon }) => {
            const active = type === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-transparent bg-gradient-to-r from-brand to-brand-sky text-white shadow-brand'
                    : 'bg-surface text-ink-muted hover:border-brand/40 hover:text-ink'
                }`}
              >
                <Icon aria-hidden="true" />
                {label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] tabular ${active ? 'bg-white/20' : 'bg-surface-sunken text-ink-faint'}`}>
                  {loaded ? count : '·'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full xl:max-w-md">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(guardChange(event, { mode: 'text', max: LIMITS.search }).value)}
              placeholder="Buscar por fecha, número, clave o emisor"
              aria-label="Buscar por fecha, número, clave de acceso o emisor"
              spellCheck={false}
              className="input rounded-full py-3 pl-11 pr-11"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                aria-label="Limpiar búsqueda"
              >
                <FiX aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="mt-1 px-3">
            <CharCounter length={countCharacters(search)} max={LIMITS.search} />
          </div>
        </div>
      </div>

      {data.unavailableIssuers?.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          No pudimos consultar a {data.unavailableIssuers.join(', ')} en este momento: algunos comprobantes podrían no
          aparecer. Inténtelo de nuevo en unos minutos.
        </p>
      )}

      <div aria-busy={loading} aria-live="polite">
        {error ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <FiAlertTriangle className="text-3xl text-danger" aria-hidden="true" />
            <p className="text-ink">{error}</p>
            <button type="button" onClick={load} className="btn-ghost">Reintentar</button>
          </div>
        ) : loading && !loaded ? (
          <GridSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState filtered={filtered} onClear={() => { setSearch(''); setType('ALL'); }} />
        ) : (
          <ul className={`grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 min-[1760px]:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((doc) => (
              <DocumentCard key={`${doc.instanceCode}-${doc.accessKey}`} doc={doc} toast={toast} />
            ))}
          </ul>
        )}
      </div>

      {!error && data.total > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} size={PAGE_SIZE} onPage={goToPage} />
      )}
    </div>
  );
}

/** Bienvenida con el degradado del ala del isotipo y el resumen de sus documentos. */
function Hero({ name, data, loaded }) {
  const stats = [
    { label: 'Documentos', value: data.documentCount },
    { label: 'Facturas', value: data.invoiceCount },
    { label: 'Notas de crédito', value: data.creditNoteCount },
  ];
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-deep via-[#0a5fb0] to-brand-sky px-6 py-7 text-white shadow-brand sm:px-10 sm:py-9">
      <div className="grid-hairline-light absolute inset-0 opacity-60 [mask-image:linear-gradient(90deg,#000,transparent_75%)]" aria-hidden="true" />
      <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-brand-cyan/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-ai/35 blur-3xl" aria-hidden="true" />

      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="eyebrow text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Portal de descargas
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl xl:text-4xl">
            Hola, {titleCase(name)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Descargue el PDF (RIDE) y el XML autorizado de las facturas y notas de crédito que le emitieron los negocios
            que trabajan con FluxoERP.
          </p>
          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur sm:px-4">
                <p className="font-display text-2xl font-bold tabular sm:text-3xl">{loaded ? stat.value : '—'}</p>
                <p className="mt-0.5 text-[11px] font-medium text-white/75 sm:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
          {data.lastIssueDate && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/85">
              <FiCalendar aria-hidden="true" /> Último comprobante: {formatDate(data.lastIssueDate)}
            </p>
          )}
        </div>
        <div className="hidden w-[300px] lg:block xl:w-[360px]">
          <div className="animate-float">
            <DocumentsIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function downloadPath(doc, format) {
  return `/documents/${encodeURIComponent(doc.instanceCode)}/${doc.typeUrl}/${doc.accessKey}/${format}`;
}

function fileName(doc, format) {
  const prefix = doc.type === 'CREDIT_NOTE' ? 'NOTA_CREDITO' : 'FACTURA';
  return `${prefix}_${String(doc.number || doc.accessKey).replace(/[^0-9-]/g, '')}.${format}`;
}

/** Un comprobante en una tarjeta de la cuadrícula. */
function DocumentCard({ doc, toast }) {
  const invoice = doc.type === 'INVOICE';
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-[22px] border bg-surface shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${invoice ? 'bg-gradient-to-r from-brand via-brand-sky to-brand-cyan' : 'bg-gradient-to-r from-ai via-brand to-brand-sky'}`}
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`chip ${invoice ? 'bg-brand/10 text-brand' : 'bg-ai/10 text-ai'}`}>
            {invoice ? <FiFileText aria-hidden="true" /> : <FiFileMinus aria-hidden="true" />}
            {DOCUMENT_TYPES[doc.type]?.label || doc.type}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted tabular">
            <FiCalendar aria-hidden="true" /> {formatDate(doc.issueDate)}
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-display text-xl font-bold tracking-tight text-ink tabular">{doc.number}</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-ink-muted">
              <FiBriefcase aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink" title={doc.issuerName}>{doc.issuerName || '—'}</p>
              <p className="text-xs text-ink-faint tabular">RUC {doc.issuerRuc}</p>
            </div>
          </div>
        </div>

        <AccessKey value={doc.accessKey} toast={toast} />

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Total</p>
            <p className="font-display text-2xl font-bold text-ink tabular">{formatMoney(doc.total)}</p>
          </div>
          <div className="flex gap-2">
            <FileButton doc={doc} format="pdf" toast={toast} />
            <FileButton doc={doc} format="xml" toast={toast} />
          </div>
        </div>
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
      await downloadFile(downloadPath(doc, format), fileName(doc, format));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={get}
      disabled={!available || busy}
      title={available ? (pdf ? 'Descargar el RIDE en PDF' : 'Descargar el XML autorizado') : `Este comprobante no tiene ${pdf ? 'PDF' : 'XML'}`}
      aria-label={pdf ? `Descargar PDF de ${doc.number}` : `Descargar XML de ${doc.number}`}
      className={
        pdf
          ? 'btn-accent px-3.5 py-2'
          : 'btn border border-brand/30 bg-brand/5 px-3.5 py-2 text-brand hover:bg-brand/10'
      }
    >
      <FiDownload className={busy ? 'animate-bounce' : ''} aria-hidden="true" /> {pdf ? 'PDF' : 'XML'}
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
    <div className="rounded-2xl bg-surface-muted px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Clave de acceso</p>
        <button
          type="button"
          onClick={copy}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${copied ? 'text-good' : 'text-ink-faint hover:bg-surface-sunken hover:text-ink'}`}
          aria-label="Copiar clave de acceso"
        >
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-[11.5px] leading-relaxed text-ink-muted">{value}</p>
    </div>
  );
}

function EmptyState({ filtered, onClear }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="mb-2 w-56 rounded-[28px] bg-gradient-to-br from-brand-deep via-[#0a5fb0] to-brand-sky p-4">
        <DocumentsIllustration />
      </div>
      <p className="font-display text-lg font-bold text-ink">
        {filtered ? 'Ningún comprobante coincide con la búsqueda' : 'Todavía no tiene comprobantes autorizados'}
      </p>
      <p className="max-w-md text-sm text-ink-muted">
        {filtered
          ? 'Pruebe con otra fecha (por ejemplo 12-11-2026), el número, la clave de acceso o el nombre del emisor.'
          : 'Cuando un negocio que usa FluxoERP le emita una factura electrónica autorizada, aparecerá aquí.'}
      </p>
      {filtered && (
        <button type="button" onClick={onClear} className="btn-primary mt-3">
          Ver todos
        </button>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1760px]:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((card) => (
        <li key={card} className="animate-pulse space-y-4 rounded-[22px] border bg-surface p-5">
          <div className="flex justify-between">
            <div className="h-6 w-24 rounded-full bg-surface-sunken" />
            <div className="h-5 w-20 rounded-full bg-surface-sunken" />
          </div>
          <div className="h-7 w-48 rounded-lg bg-surface-sunken" />
          <div className="h-10 w-full rounded-xl bg-surface-sunken" />
          <div className="h-16 w-full rounded-2xl bg-surface-sunken" />
          <div className="flex justify-between">
            <div className="h-10 w-24 rounded-lg bg-surface-sunken" />
            <div className="h-10 w-36 rounded-xl bg-surface-sunken" />
          </div>
        </li>
      ))}
    </ul>
  );
}
