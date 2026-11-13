import { FiCheckCircle, FiPhone } from 'react-icons/fi';
import ThemeButton from './BotonTema';
import IllustrationCarousel from './CarruselIlustraciones';
import { StageBackdrop } from './FondoFluxo';
import Logo from './Logo';
import { useSupport } from '../utilidades/soporte';

const HIGHLIGHTS = ['PDF (RIDE) y XML autorizados por el SRI', 'Todas sus facturas en un solo lugar', 'Acceso personal con su RUC o cédula'];

/**
 * Pantallas sin sesión (ingreso y recuperar). Escenario oscuro de marca con las
 * auroras de flxia.net: a la izquierda el texto FIJO y las ilustraciones que
 * cambian; a la derecha el formulario en una tarjeta flotante que sigue el tema.
 * En celular solo se ve el formulario.
 */
export default function AccessLayout({ children }) {
  const support = useSupport();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1220] text-white">
      <StageBackdrop />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <header className="flex items-center justify-between">
          <Logo onDark />
          <ThemeButton onDark />
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-16 xl:gap-24">
          <section className="hidden lg:block">
            <p className="eyebrow text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> FluxoERP · Comprobantes electrónicos
            </p>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.08] xl:text-[52px]">
              Portal de Descargas de <span className="text-gradient-fluxo">Documentos Recibidos</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Si va a ingresar por primera vez al portal, el usuario y contraseña es su RUC o Cédula.
            </p>
            <div className="mt-8 grid max-w-2xl items-center gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-deep/70 via-[#0a5fb0]/50 to-brand-sky/30 px-6 pb-5 pt-6 shadow-2xl backdrop-blur">
                <IllustrationCarousel />
              </div>
              <ul className="space-y-3 text-sm text-white/80">
                {HIGHLIGHTS.map((text) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-brand-cyan" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="w-full max-w-[440px] animate-rise-in justify-self-center lg:justify-self-end">
            <div className="rounded-[28px] border border-white/10 bg-surface p-6 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] sm:p-8">
              {children}
              <div className="mt-7 flex items-center justify-center gap-2 border-t pt-5 text-xs text-ink-muted">
                ¿Necesita ayuda?
                <a
                  href={support.whatsapp ? `https://wa.me/${support.whatsapp}` : `tel:${support.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <FiPhone aria-hidden="true" />
                  {support.phone}
                </a>
              </div>
            </div>
          </section>
        </div>

        <footer className="text-center text-xs text-white/50">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>
      </div>
    </div>
  );
}
