/**
 * "10 / 13" junto al campo; se pone en rojo al llegar al tope. Los caracteres
 * prohibidos simplemente no se escriben: sin aviso (pedido de Cristian, 13-nov).
 */
export default function CharCounter({ length, max }) {
  const full = length >= max;
  return (
    <span className="flex min-h-[16px] items-center justify-end text-[11px] font-medium tabular">
      <span className={`shrink-0 ${full ? 'text-danger' : 'text-ink-faint'}`}>
        {length} / {max}
      </span>
    </span>
  );
}
