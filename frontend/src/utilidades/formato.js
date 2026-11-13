const DATE = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
const MONEY = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** "2026-11-12T10:30:00" → "12/11/2026" (the ERP stores Ecuador local time). */
export function formatDate(value) {
  if (!value) return '—';
  const [datePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year) return '—';
  return DATE.format(new Date(year, month - 1, day));
}

export function formatMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? MONEY.format(number) : '—';
}

export const DOCUMENT_TYPES = {
  INVOICE: { label: 'Factura', short: 'FAC' },
  CREDIT_NOTE: { label: 'Nota de crédito', short: 'NC' },
};

/** "Cédula" or "RUC", for messages. */
export function identificationKind(identification) {
  return String(identification || '').length === 13 ? 'RUC' : 'cédula';
}
