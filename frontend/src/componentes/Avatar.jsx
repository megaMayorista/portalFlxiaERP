import { initials } from '../utilidades/formato';

/** Iniciales sobre el degradado de marca (azul → violeta). */
export default function Avatar({ name, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 rounded-full text-xs',
    md: 'h-10 w-10 rounded-full text-sm',
    xl: 'h-24 w-24 rounded-[28px] text-3xl',
  };
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-brand via-brand-sky to-ai font-display font-bold text-white shadow-brand ${sizes[size] || sizes.md}`}
    >
      {initials(name)}
    </span>
  );
}
