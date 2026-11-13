import { useId, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { countCharacters, guardChange } from '../utilidades/caracteres';
import CharCounter from './ContadorCaracteres';

/**
 * Campo con la regla de caracteres: lo que no se acepta no llega a escribirse
 * (tampoco pegado) y el contador muestra el tope. Sin maxLength a propósito
 * (ver utilidades/caracteres.js).
 *
 * mode: 'text' | 'digits' | 'password'
 */
export default function Field({
  label,
  value,
  onChange,
  mode = 'text',
  max,
  type,
  icon: Icon,
  hint,
  error,
  className = '',
  inputClassName = '',
  ...rest
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = mode === 'password';

  const handleChange = (event) => {
    onChange(guardChange(event, { mode, max }).value);
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        )}
        <input
          id={id}
          value={value}
          onChange={handleChange}
          type={isPassword ? (visible ? 'text' : 'password') : type || 'text'}
          inputMode={mode === 'digits' ? 'numeric' : undefined}
          spellCheck={false}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? `${id}-nota` : undefined}
          className={`input ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''} ${inputClassName}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:text-ink"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p id={`${id}-nota`} className={`text-xs leading-snug ${error ? 'text-danger' : 'text-ink-faint'}`}>
          {error || hint}
        </p>
        {max && <CharCounter length={countCharacters(value)} max={max} />}
      </div>
    </div>
  );
}
