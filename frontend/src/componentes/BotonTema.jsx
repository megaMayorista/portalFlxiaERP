import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../contexto/TemaContexto';

export default function ThemeButton({ className = '' }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-surface text-ink-muted transition hover:text-ink ${className}`}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    </button>
  );
}
