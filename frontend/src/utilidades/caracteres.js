/**
 * Regla de caracteres del portal (la misma de todos los proyectos):
 *  - estos símbolos no se pueden escribir ni pegar: * / = ¿ ? ( ) \ & % $ # ! ¡ ° | ; : comillas ¬ ` < >
 *  - cada campo tiene un límite visible ("10 / 13") y no deja pasar de él.
 * El backend rechaza la misma lista (CaracteresProhibidos.java): mantener ambos iguales.
 *
 * Excepción: las contraseñas aceptan símbolos (las hacen más fuertes y solo se
 * guarda su hash). Solo se bloquean espacios y caracteres invisibles.
 *
 * El tope lo pone el filtro, NO maxLength: el navegador recorta lo pegado al
 * tope antes de limpiarlo ("17a10-034#065" en una cédula quedaba en 7 dígitos).
 */
export const FORBIDDEN_CHARACTERS = '*/=¿?()\\&%$#!¡°|;:"\'“”‘’¬`<>';

const FORBIDDEN = new Set(Array.from(FORBIDDEN_CHARACTERS));

function isControl(char) {
  const code = char.codePointAt(0);
  return (
    code < 32 ||
    code === 127 ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

/** Lo que acepta cada tipo de campo, caracter por caracter. */
const MODES = {
  text: (char) => !FORBIDDEN.has(char) && !isControl(char),
  digits: (char) => /[0-9]/.test(char),
  password: (char) => !isControl(char) && !/\s/.test(char),
};

/** Topes por campo: los mismos números que valida el backend (FormatoEntrada.java). */
export const LIMITS = {
  identification: 13,
  search: 60,
  name: 200,
  password: 64,
};

/**
 * Limpia un valor tecleado o pegado: quita lo que el campo no acepta y lo corta
 * en `max`. Devuelve { value, blocked } (blocked = caracteres rechazados).
 */
export function guardText(raw, { mode = 'text', max } = {}) {
  const accepts = MODES[mode] || MODES.text;
  let value = '';
  const blocked = [];
  Array.from(String(raw ?? '')).forEach((char) => {
    if (!accepts(char)) {
      if (char.trim() && !blocked.includes(char)) blocked.push(char);
      return;
    }
    if (max && Array.from(value).length >= max) return;
    value += char;
  });
  return { value, blocked };
}

/** onChange de un input controlado: valor limpio y el cursor donde estaba. */
export function guardChange(event, options) {
  const input = event.target;
  const raw = input.value;
  const { value, blocked } = guardText(raw, options);
  if (value !== raw && typeof input.selectionStart === 'number') {
    const caret = guardText(raw.slice(0, input.selectionStart), { mode: options?.mode }).value.length;
    const position = Math.min(caret, value.length);
    window.requestAnimationFrame(() => {
      try {
        input.setSelectionRange(position, position);
      } catch {
        /* algunos tipos de input no tienen selección */
      }
    });
  }
  return { value, blocked };
}

export function countCharacters(value) {
  return Array.from(String(value ?? '')).length;
}
