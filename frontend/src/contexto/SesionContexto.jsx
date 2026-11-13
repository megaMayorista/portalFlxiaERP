import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setSessionExpiredHandler } from '../utilidades/api';

const SessionContext = createContext(null);

/**
 * Who is logged in. The cookie is HttpOnly, so the page asks the API
 * (/auth/session) instead of reading it. `user` is null when nobody is.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let alive = true;
    api('/auth/session', { silent401: true })
      .then((data) => alive && setUser(data))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser((current) => {
        if (current) setExpired(true);
        return null;
      });
    });
  }, []);

  const login = useCallback(async (identification, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { identification, password }, silent401: true });
    setExpired(false);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', silent401: true });
    } catch {
      /* the session may already be gone: the result is the same */
    }
    setUser(null);
  }, []);

  /** After changing the name or the password. */
  const update = useCallback((changes) => setUser((current) => (current ? { ...current, ...changes } : current)), []);

  const value = useMemo(
    () => ({ user, loading, expired, login, logout, update, clearExpired: () => setExpired(false) }),
    [user, loading, expired, login, logout, update],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
