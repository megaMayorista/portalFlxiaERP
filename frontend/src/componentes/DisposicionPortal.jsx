import { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiFileText, FiLogOut, FiShield, FiUser } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../contexto/SesionContexto';
import { identificationKind, titleCase } from '../utilidades/formato';
import Avatar from './Avatar';
import ThemeButton from './BotonTema';
import { PortalBackdrop } from './FondoFluxo';
import Logo from './Logo';

/**
 * Pantallas con sesión, identidad Fluxo: barra superior de cristal con las
 * secciones en una píldora, menú de usuario con avatar y, en celular, barra de
 * pestañas abajo. El contenido ocupa todo el ancho (hasta 1680 px).
 */
export default function PortalLayout({ title, children }) {
  const { user } = useSession();

  useEffect(() => {
    document.title = `${title} · Portal de Descargas FluxoIA`;
  }, [title]);

  const tab = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-surface text-brand shadow-soft' : 'text-ink-muted hover:text-ink'
    }`;

  return (
    <div className="relative isolate flex min-h-screen flex-col pb-20 md:pb-0">
      <PortalBackdrop />

      <header className="sticky top-0 z-30 border-b bg-surface/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link to="/comprobantes" aria-label="Mis comprobantes" className="shrink-0">
            <Logo />
          </Link>
          <nav className="mx-auto hidden items-center gap-1 rounded-full border bg-surface-sunken/80 p-1 md:flex" aria-label="Secciones">
            {!user.mustChangePassword && (
              <NavLink to="/comprobantes" className={tab}>
                <FiFileText aria-hidden="true" /> Mis comprobantes
              </NavLink>
            )}
            <NavLink to="/perfil" className={tab}>
              <FiUser aria-hidden="true" /> Mi perfil
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ThemeButton />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {user.usingDefaultPassword && !user.mustChangePassword && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
              <FiShield aria-hidden="true" />
            </span>
            <p className="flex-1 text-sm text-ink">
              <strong>Proteja sus comprobantes.</strong>{' '}
              <span className="text-ink-muted">
                Su contraseña sigue siendo su {identificationKind(user.identification)}: cualquiera que la conozca puede entrar.
              </span>
            </p>
            <Link to="/perfil#clave" className="btn-accent py-2">
              Cambiar ahora
            </Link>
          </div>
        )}
        {children}
      </main>

      <footer className="px-4 pb-6 pt-2 text-center text-xs text-ink-faint">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>

      <MobileTabs />
    </div>
  );
}

function useLogout() {
  const { logout } = useSession();
  const navigate = useNavigate();
  return async () => {
    await logout();
    navigate('/ingreso', { replace: true });
  };
}

function UserMenu() {
  const { user } = useSession();
  const exit = useLogout();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !box.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border bg-surface py-1 pl-1 pr-2 transition hover:border-brand/40 lg:pr-3"
      >
        <Avatar name={user.fullName} size="sm" />
        <span className="hidden max-w-[220px] text-left leading-tight lg:block">
          <span className="block truncate text-sm font-semibold text-ink">{titleCase(user.fullName)}</span>
          <span className="block text-[11px] text-ink-faint tabular">{user.identification}</span>
        </span>
        <FiChevronDown className={`hidden text-ink-faint transition sm:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 animate-rise-in overflow-hidden rounded-2xl border bg-surface shadow-card">
          <div className="flex items-center gap-3 border-b bg-surface-muted px-4 py-3.5">
            <Avatar name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{titleCase(user.fullName)}</p>
              <p className="text-xs text-ink-faint tabular">
                {identificationKind(user.identification) === 'RUC' ? 'RUC' : 'Cédula'} {user.identification}
              </p>
            </div>
          </div>
          <div className="p-1.5">
            <Link to="/perfil" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-surface-sunken">
              <FiUser className="text-ink-muted" aria-hidden="true" /> Mi perfil
            </Link>
            <button type="button" role="menuitem" onClick={exit} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10">
              <FiLogOut aria-hidden="true" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTabs() {
  const { user } = useSession();
  const exit = useLogout();
  const item = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition ${isActive ? 'text-brand' : 'text-ink-faint'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-surface/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Secciones">
      {!user.mustChangePassword && (
        <NavLink to="/comprobantes" className={item}>
          <FiFileText className="text-xl" aria-hidden="true" /> Comprobantes
        </NavLink>
      )}
      <NavLink to="/perfil" className={item}>
        <FiUser className="text-xl" aria-hidden="true" /> Mi perfil
      </NavLink>
      <button type="button" onClick={exit} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold text-ink-faint">
        <FiLogOut className="text-xl" aria-hidden="true" /> Salir
      </button>
    </nav>
  );
}
