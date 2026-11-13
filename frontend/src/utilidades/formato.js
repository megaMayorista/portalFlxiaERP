const MONEY = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/**
 * "2026-11-12T10:30:00" → "12-11-2026" (the ERP stores Ecuador local time).
 * With dashes, not slashes: it is the same text the search accepts ("/" is a
 * forbidden character), so a date can be copied from the list into the search.
 */
export function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('T')[0].split('-');
  if (!year || !month || !day) return '—';
  return `${day}-${month}-${year}`;
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
