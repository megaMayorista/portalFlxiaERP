/**
 * Ilustraciones del panel de ingreso, dibujadas en código con los colores de
 * Fluxo (blanco sobre el degradado azul, naranja = acción, cian = marca).
 * Son decorativas: aria-hidden. Para cambiarlas por imágenes propias basta con
 * reemplazar estos componentes en CarruselIlustraciones.jsx.
 */
const ORANGE = '#f0643b';
const CYAN = '#02ceff';
const DEEP = '#0b3a6e';
const LINE = '#dbe5f2';

/** Facturas apiladas con sus formatos PDF y XML. */
export function DocumentsIllustration() {
  return (
    <svg viewBox="0 0 440 340" className="h-full w-full" aria-hidden="true">
      <circle cx="220" cy="175" r="150" fill="#ffffff" opacity="0.06" />
      <circle cx="220" cy="175" r="105" fill="#ffffff" opacity="0.06" />

      <g transform="rotate(-9 190 190)">
        <rect x="100" y="70" width="190" height="240" rx="18" fill="#ffffff" opacity="0.22" />
      </g>
      <g transform="rotate(5 250 180)">
        <rect x="150" y="58" width="190" height="240" rx="18" fill="#ffffff" opacity="0.35" />
      </g>

      <g>
        <rect x="125" y="45" width="200" height="255" rx="18" fill="#ffffff" />
        <rect x="145" y="66" width="34" height="34" rx="9" fill={DEEP} />
        <path d="M154 92 V76 h17 M154 84 h12" stroke={CYAN} strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="189" y="70" width="90" height="9" rx="4.5" fill={DEEP} opacity="0.85" />
        <rect x="189" y="86" width="60" height="7" rx="3.5" fill={LINE} />
        <rect x="145" y="118" width="160" height="1.5" fill={LINE} />
        {[132, 152, 172, 192].map((y, i) => (
          <g key={y}>
            <rect x="145" y={y} width={i % 2 ? 78 : 96} height="7" rx="3.5" fill={LINE} />
            <rect x="268" y={y} width="37" height="7" rx="3.5" fill={LINE} />
          </g>
        ))}
        <rect x="145" y="214" width="160" height="1.5" fill={LINE} />
        <rect x="145" y="228" width="58" height="9" rx="4.5" fill={DEEP} opacity="0.85" />
        <rect x="250" y="226" width="55" height="13" rx="6.5" fill={ORANGE} />
        <rect x="145" y="258" width="160" height="22" rx="6" fill="#eef4fb" />
        <rect x="153" y="266" width="120" height="6" rx="3" fill="#b9c9de" />
      </g>

      <g className="origin-center">
        <rect x="300" y="88" width="78" height="36" rx="18" fill={ORANGE} />
        <text x="339" y="112" textAnchor="middle" fontFamily="Space Grotesk, Inter, sans-serif" fontWeight="700" fontSize="16" fill="#fff">PDF</text>
        <rect x="312" y="136" width="78" height="36" rx="18" fill={CYAN} />
        <text x="351" y="160" textAnchor="middle" fontFamily="Space Grotesk, Inter, sans-serif" fontWeight="700" fontSize="16" fill={DEEP}>XML</text>
      </g>

      <circle cx="122" cy="282" r="28" fill="#16a34a" />
      <path d="M109 282 l9 9 l17 -18" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Pantalla con la lista de comprobantes y la flecha de descarga. */
export function DownloadIllustration() {
  return (
    <svg viewBox="0 0 440 340" className="h-full w-full" aria-hidden="true">
      <circle cx="220" cy="170" r="150" fill="#ffffff" opacity="0.06" />

      <rect x="55" y="48" width="320" height="205" rx="18" fill="#ffffff" opacity="0.95" />
      <rect x="55" y="48" width="320" height="34" rx="18" fill="#e9f1fb" />
      <rect x="55" y="66" width="320" height="16" fill="#e9f1fb" />
      <circle cx="78" cy="65" r="5" fill={ORANGE} />
      <circle cx="94" cy="65" r="5" fill="#f5b041" />
      <circle cx="110" cy="65" r="5" fill="#34c38f" />

      {[98, 146, 194].map((y, i) => (
        <g key={y}>
          <rect x="72" y={y} width="286" height="40" rx="10" fill={i === 0 ? '#f2f7fd' : '#ffffff'} stroke={LINE} />
          <rect x="84" y={y + 10} width="20" height="20" rx="5" fill={DEEP} opacity="0.9" />
          <rect x="114" y={y + 10} width={i === 1 ? 92 : 112} height="7" rx="3.5" fill={DEEP} opacity="0.75" />
          <rect x="114" y={y + 23} width="70" height="6" rx="3" fill={LINE} />
          <rect x="268" y={y + 10} width="38" height="20" rx="6" fill={ORANGE} />
          <rect x="312" y={y + 10} width="38" height="20" rx="6" fill={CYAN} />
        </g>
      ))}

      <rect x="196" y="253" width="38" height="26" fill="#ffffff" opacity="0.75" />
      <rect x="160" y="277" width="110" height="10" rx="5" fill="#ffffff" opacity="0.85" />

      <circle cx="350" cy="250" r="46" fill={ORANGE} />
      <circle cx="350" cy="250" r="46" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="6" />
      <path d="M350 225 v40 M333 250 l17 17 l17 -17" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Documento perdido con lupa: para la vista 404. */
export function LostDocumentIllustration() {
  return (
    <svg viewBox="0 0 440 340" className="h-full w-full" aria-hidden="true">
      <circle cx="220" cy="170" r="150" fill="#ffffff" opacity="0.06" />
      <g transform="rotate(-7 200 170)">
        <rect x="110" y="55" width="190" height="240" rx="18" fill="#ffffff" opacity="0.25" />
      </g>
      <rect x="130" y="45" width="190" height="245" rx="18" fill="#ffffff" />
      <rect x="150" y="68" width="34" height="34" rx="9" fill={DEEP} />
      <path d="M159 94 V78 h17 M159 86 h12" stroke={CYAN} strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="194" y="72" width="90" height="9" rx="4.5" fill={DEEP} opacity="0.85" />
      <rect x="194" y="88" width="60" height="7" rx="3.5" fill={LINE} />
      {[124, 144, 164].map((y) => (
        <rect key={y} x="150" y={y} width="150" height="7" rx="3.5" fill={LINE} strokeDasharray="6 6" />
      ))}
      <text x="225" y="250" textAnchor="middle" fontFamily="Space Grotesk, Inter, sans-serif" fontWeight="700" fontSize="58" fill={LINE}>?</text>
      <g>
        <circle cx="318" cy="210" r="46" fill="none" stroke={ORANGE} strokeWidth="12" />
        <circle cx="318" cy="210" r="40" fill="#ffffff" opacity="0.18" />
        <path d="M350 244 l40 40" stroke={ORANGE} strokeWidth="16" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Credencial con RUC / cédula y escudo: el acceso es personal. */
export function SecurityIllustration() {
  return (
    <svg viewBox="0 0 440 340" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="escudo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={CYAN} />
        </linearGradient>
      </defs>
      <circle cx="220" cy="175" r="150" fill="#ffffff" opacity="0.06" />

      <g transform="rotate(-6 170 200)">
        <rect x="48" y="118" width="240" height="150" rx="18" fill="#ffffff" />
        <rect x="48" y="118" width="240" height="38" rx="18" fill={DEEP} />
        <rect x="48" y="140" width="240" height="16" fill={DEEP} />
        <rect x="66" y="131" width="70" height="9" rx="4.5" fill={CYAN} />
        <circle cx="100" cy="205" r="28" fill="#e9f1fb" />
        <circle cx="100" cy="197" r="10" fill="#9fb6d3" />
        <path d="M82 222 q18 -22 36 0" fill="#9fb6d3" />
        <text x="144" y="188" fontFamily="Space Grotesk, Inter, sans-serif" fontWeight="700" fontSize="12" fill={DEEP} letterSpacing="1.5">RUC / CÉDULA</text>
        <rect x="144" y="198" width="118" height="10" rx="5" fill={DEEP} opacity="0.8" />
        <rect x="144" y="216" width="88" height="7" rx="3.5" fill={LINE} />
        <rect x="144" y="230" width="104" height="7" rx="3.5" fill={LINE} />
      </g>

      <g>
        <path d="M318 72 l62 24 v54 c0 46 -28 78 -62 94 c-34 -16 -62 -48 -62 -94 v-54 z" fill="url(#escudo)" />
        <path d="M318 72 l62 24 v54 c0 46 -28 78 -62 94 c-34 -16 -62 -48 -62 -94 v-54 z" fill="none" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.6" />
        <path d="M292 156 l18 18 l34 -36" stroke={DEEP} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      <g>
        <rect x="300" y="250" width="56" height="44" rx="10" fill={ORANGE} />
        <path d="M313 250 v-12 a15 15 0 0 1 30 0 v12" stroke={ORANGE} strokeWidth="7" fill="none" />
        <circle cx="328" cy="270" r="6" fill="#ffffff" />
        <rect x="325.5" y="272" width="5" height="11" rx="2.5" fill="#ffffff" />
      </g>
    </svg>
  );
}
