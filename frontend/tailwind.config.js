/**
 * Design system of the portal: the same tokens as flxia.net (blue = data,
 * orange = action, violet = AI; Inter + Space Grotesk). Every color points to a
 * CSS variable in src/estilos.css, which has a light and a dark version, so the
 * dark mode is a class on <html> and nothing else.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
          sunken: token('surface-sunken'),
        },
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          faint: token('ink-faint'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        brand: {
          DEFAULT: token('brand'),
          strong: token('brand-strong'),
          soft: token('brand-soft'),
          deep: '#004a8b',
          sky: '#018bc9',
          cyan: '#02ceff',
        },
        accent: {
          DEFAULT: token('accent'),
          strong: token('accent-strong'),
        },
        ai: token('ai'),
        good: token('good'),
        warn: token('warn'),
        danger: token('danger'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 10px -3px rgb(10 18 32 / 0.10)',
        card: '0 16px 40px -20px rgb(10 18 32 / 0.22)',
        brand: '0 24px 56px -28px rgb(37 99 235 / 0.6)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'rise-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'rise-in': 'rise-in .45s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
