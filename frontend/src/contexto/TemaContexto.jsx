import { createContext, useCallback, useContext, useState } from 'react';

const ThemeContext = createContext(null);
const KEY = 'portal-tema';

/** Light / dark. public/tema.js already applied the saved one before React. */
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = useCallback(() => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem(KEY, next ? 'oscuro' : 'claro');
      } catch {
        /* private mode: it lasts until the tab is closed */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
