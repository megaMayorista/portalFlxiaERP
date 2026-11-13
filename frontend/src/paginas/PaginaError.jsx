import { FiArrowLeft, FiPhone } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ThemeButton from '../componentes/BotonTema';
import { StageBackdrop } from '../componentes/FondoFluxo';
import { LostDocumentIllustration, SecurityIllustration } from '../componentes/Ilustraciones';
import Logo from '../componentes/Logo';
import { useSession } from '../contexto/SesionContexto';
import { useSupport } from '../utilidades/soporte';

const VIEWS = {
  404: {
    eyebrow: 'Página no encontrada',
    title: 'Esta página no existe',
    text: 'La dirección está mal escrita o cambió. Sus comprobantes siguen a salvo: vuelva al inicio para verlos.',
    Illustration: LostDocumentIllustration,
  },
  403: {
    eyebrow: 'Acceso no permitido',
    title: 'No puede ver esta página',
    text: 'Su sesión no tiene permiso para realizar esta acción. Si cree que es un error, vuelva a ingresar o comuníquese con soporte.',
    Illustration: SecurityIllustration,
  },
};

/** Vistas 404 y 403 con la identidad de Fluxo (escenario oscuro de marca). */
export default function ErrorPage({ code = 404 }) {
  const { user } = useSession();
  const support = useSupport();
  const view = VIEWS[code] || VIEWS[404];
  const { Illustration } = view;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a1220] text-white">
      <StageBackdrop />
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="Ir al inicio">
            <Logo onDark />
          </Link>
          <ThemeButton onDark />
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="animate-rise-in">
            <p className="eyebrow text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Error {code} · {view.eyebrow}
            </p>
            <p className="text-gradient-fluxo mt-2 font-display text-[110px] font-bold leading-none tracking-tight sm:text-[150px]">{code}</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{view.title}</h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">{view.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? '/comprobantes' : '/ingreso'} className="btn-primary px-5 py-3">
                <FiArrowLeft aria-hidden="true" /> {user ? 'Ir a mis comprobantes' : 'Ir a iniciar sesión'}
              </Link>
              <a href={`https://wa.me/${support.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-glass px-5 py-3">
                <FiPhone aria-hidden="true" /> Soporte {support.phone}
              </a>
            </div>
          </div>
          <div className="mx-auto hidden w-full max-w-md rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-deep/70 via-[#0a5fb0]/50 to-brand-sky/30 p-6 shadow-2xl backdrop-blur sm:block">
            <div className="animate-float">
              <Illustration />
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-white/50">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>
      </div>
    </div>
  );
}
