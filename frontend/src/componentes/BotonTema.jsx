import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../contexto/TemaContexto';

/** Botón redondo de tema. `onDark` para el escenario oscuro de marca. */
export default function ThemeButton({ onDark = false, className = '' }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
        onDark
          ? 'border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/20'
          : 'bg-surface text-ink-muted hover:border-brand/40 hover:text-brand'
      } ${className}`}
    >
      {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    </button>
  );
}
