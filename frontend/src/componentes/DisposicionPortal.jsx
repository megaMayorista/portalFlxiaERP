import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiFileText, FiLogOut, FiMenu, FiUser, FiX } from 'react-icons/fi';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../contexto/SesionContexto';
import { identificationKind } from '../utilidades/formato';
import ThemeSwitch from './BotonTema';
import Logo from './Logo';

/**
 * Pantallas con sesión, a pantalla completa:
 *  - arriba: logo, título de la sección centrado e interruptor de tema;
 *  - izquierda: "Bienvenido", nombre del cliente, menú y Cerrar sesión;
 *  - en celular el menú se abre como cajón desde la izquierda.
 */
export default function PortalLayout({ title, children }) {
  const { user } = useSession();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="sticky top-0 z-30 border-b bg-surface">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
              aria-label="Abrir menú"
            >
              <FiMenu className="text-xl" aria-hidden="true" />
            </button>
            <Link to="/comprobantes" aria-label="Mis comprobantes">
              <Logo subtitle={false} />
            </Link>
          </div>
          <h1 className="hidden text-center font-display text-base font-bold uppercase tracking-wide text-navy dark:text-ink md:block xl:text-xl">
            {title}
          </h1>
          <div className="col-start-3 flex justify-end">
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r bg-surface lg:block">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
            <button
              type="button"
              className="absolute inset-0 h-full w-full animate-fade-in bg-black/40"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-rise-in bg-surface shadow-card">
              <div className="flex h-16 items-center justify-between border-b px-4">
                <Logo subtitle={false} />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-sunken"
                  aria-label="Cerrar menú"
                >
                  <FiX className="text-xl" aria-hidden="true" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {user.usingDefaultPassword && !user.mustChangePassword && (
            <div className="border-b border-warn/20 bg-warn/10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm text-warn sm:px-6 lg:px-8">
                <FiAlertTriangle className="shrink-0" aria-hidden="true" />
                <span className="flex-1">
                  Su contraseña sigue siendo su {identificationKind(user.identification)}. Cámbiela para proteger sus comprobantes.
                </span>
                <Link to="/perfil#clave" className="font-semibold underline underline-offset-2">
                  Cambiar ahora
                </Link>
              </div>
            </div>
          )}
          <main className="flex-1 px-3 py-5 sm:px-6 lg:px-8 lg:py-7">
            <h1 className="mb-4 text-center font-display text-base font-bold uppercase tracking-wide text-navy dark:text-ink md:hidden">
              {title}
            </h1>
            {children}
          </main>
          <footer className="px-4 pb-5 text-center text-xs text-ink-faint">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const exit = async () => {
    setLeaving(true);
    await logout();
    navigate('/ingreso', { replace: true });
  };

  const item = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-navy text-white shadow-soft' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
    }`;

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="px-1 pt-1">
        <p className="text-xs text-ink-muted">Bienvenido</p>
        <p className="mt-1 break-words font-display text-[15px] font-bold leading-snug text-ink">{user.fullName}</p>
        <p className="mt-0.5 text-xs text-ink-faint tabular">{user.identification}</p>
      </div>
      <nav className="space-y-1.5" aria-label="Secciones">
        {!user.mustChangePassword && (
          <NavLink to="/comprobantes" className={item}>
            <FiFileText aria-hidden="true" /> Mis Comprobantes
          </NavLink>
        )}
        <NavLink to="/perfil" className={item}>
          <FiUser aria-hidden="true" /> Perfil
        </NavLink>
      </nav>
      <button
        type="button"
        onClick={exit}
        disabled={leaving}
        className="flex items-center gap-2.5 rounded-xl bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
      >
        <FiLogOut aria-hidden="true" /> Cerrar Sesión
      </button>
    </div>
  );
}
