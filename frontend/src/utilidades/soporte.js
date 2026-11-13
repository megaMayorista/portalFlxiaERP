import { useEffect, useState } from 'react';
import { api } from './api';

/** Default until /api/public/config answers (the backend's PORTAL_SUPPORT_PHONE rules). */
const FALLBACK = { phone: '096 060 8410', whatsapp: '593960608410' };
let cached = null;

/** Support phone shown on the access screens and in errors. */
export function useSupport() {
  const [support, setSupport] = useState(cached || FALLBACK);
  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    api('/public/config', { silent401: true })
      .then((data) => {
        cached = { phone: data.supportPhone, whatsapp: data.supportWhatsapp };
        if (alive) setSupport(cached);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return support;
}
