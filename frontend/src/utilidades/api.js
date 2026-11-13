/**
 * Calls to the portal's API. The session travels in an HttpOnly cookie (the
 * page never sees it); every request that changes something carries
 * X-Portal-Request, which the backend demands against CSRF.
 */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const GENERIC_ERROR = 'No pudimos conectar con el portal. Revise su conexión e inténtelo de nuevo.';

let onSessionExpired = () => {};
let onForbidden = () => {};

/** The session context registers here what to do when the API answers 401. */
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

/** The app registers here where to go when the API answers 403 (the 403 view). */
export function setForbiddenHandler(handler) {
  onForbidden = handler;
}

async function readError(response) {
  try {
    const body = await response.json();
    return new ApiError(response.status, body.code || 'ERROR', body.message || GENERIC_ERROR);
  } catch {
    if (response.status === 429) {
      return new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Demasiadas solicitudes seguidas. Espere unos segundos.');
    }
    return new ApiError(response.status, 'ERROR', GENERIC_ERROR);
  }
}

export async function api(path, { method = 'GET', body, silent401 = false } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-Portal-Request': '1' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', GENERIC_ERROR);
  }

  if (!response.ok) {
    const error = await readError(response);
    if (response.status === 401 && !silent401) onSessionExpired();
    if (response.status === 403 && error.code === 'FORBIDDEN') onForbidden();
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

/**
 * File name from Content-Disposition. filename*= (RFC 5987) wins; an RFC 2047
 * value ("=?UTF-8?Q?...?=") is never used as a name: that is what made browsers
 * save "=_UTF-8_Q_FACTURA...pdf_=" without a usable extension.
 */
function nameFromHeader(disposition) {
  if (!disposition) return null;
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      /* malformed: try the plain one */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  return plain && !plain[1].startsWith('=?') ? plain[1].trim() : null;
}

/**
 * Downloads a PDF / XML through fetch, so an error (not yours, no PDF, issuer
 * down) is shown as a message instead of a raw page. `fileName` is the name the
 * portal builds itself (FACTURA_001-002-000001159.pdf); the header is a fallback.
 */
export async function downloadFile(path, fileName) {
  let response;
  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'NETWORK', GENERIC_ERROR);
  }
  if (!response.ok) {
    const error = await readError(response);
    if (response.status === 401) onSessionExpired();
    throw error;
  }
  const blob = await response.blob();
  const name = fileName || nameFromHeader(response.headers.get('Content-Disposition')) || 'comprobante';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
