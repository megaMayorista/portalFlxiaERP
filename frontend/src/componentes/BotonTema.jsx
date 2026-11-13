import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../contexto/TemaContexto';

/** Interruptor claro / oscuro: cielo con sol de día, noche con luna. */
export default function ThemeSwitch({ className = '' }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border transition-colors duration-300 ${
        dark ? 'border-white/10 bg-[#0f1a33]' : 'border-sky-200 bg-gradient-to-r from-sky-300 to-sky-100'
      } ${className}`}
    >
      {/* Estrellas de noche / nube de día */}
      <span className={`pointer-events-none absolute left-3 top-2 h-0.5 w-0.5 rounded-full bg-white transition-opacity ${dark ? 'opacity-80' : 'opacity-0'}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute left-5 bottom-2 h-0.5 w-0.5 rounded-full bg-white transition-opacity ${dark ? 'opacity-60' : 'opacity-0'}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute right-2 top-1/2 h-3 w-5 -translate-y-1/2 rounded-full bg-white/90 transition-opacity ${dark ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
      <span
        className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300 ${
          dark ? 'translate-x-[28px] bg-slate-200 text-slate-700' : 'bg-yellow-400 text-yellow-800'
        }`}
        aria-hidden="true"
      >
        {dark ? <FiMoon className="text-[13px]" /> : <FiSun className="text-[13px]" />}
      </span>
    </button>
  );
}
