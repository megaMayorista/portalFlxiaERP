import { FiPhone } from 'react-icons/fi';
import ThemeButton from './BotonTema';
import IllustrationCarousel from './CarruselIlustraciones';
import Logo from './Logo';
import { useSupport } from '../utilidades/soporte';

/**
 * Pantallas sin sesión (ingreso y recuperar): a la izquierda el panel de marca
 * con las ilustraciones que cambian y el texto FIJO; a la derecha el
 * formulario. En celular solo se ve el formulario.
 */
export default function AccessLayout({ children }) {
  const support = useSupport();
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="panel-marca relative hidden w-[52%] flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden="true" />
        <Logo onDark subtitle={false} />
        <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-8">
          <IllustrationCarousel />
          <h1 className="mt-10 text-center text-3xl font-bold leading-tight xl:text-4xl">
            Portal de Descargas de Documentos Recibidos
          </h1>
          <p className="mt-4 max-w-md text-center text-base leading-relaxed text-white/85">
            Si va a ingresar por primera vez al portal, el usuario y contraseña es su RUC o Cédula.
          </p>
        </div>
        <p className="text-xs text-white/60">Comprobantes electrónicos autorizados por el SRI</p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex justify-end p-4 sm:p-6">
          <ThemeButton />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[400px] animate-rise-in">
            <div className="mb-8 flex justify-center">
              <Logo size="lg" />
            </div>
            {children}
            <div className="mt-8 rounded-xl bg-surface-muted px-4 py-3 text-center text-xs leading-relaxed text-ink-muted">
              ¿Necesita ayuda? Soporte:{' '}
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
        </div>
        <footer className="px-5 pb-6 text-center text-xs text-ink-faint">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>
      </main>
    </div>
  );
}
