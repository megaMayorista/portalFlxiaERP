import { useState } from 'react';
import { FiAlertTriangle, FiFileText, FiLogOut, FiUser } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../contexto/SesionContexto';
import { identificationKind } from '../utilidades/formato';
import ThemeButton from './BotonTema';
import Logo from './Logo';

/** Pantallas con sesión: cabecera con navegación, aviso de la clave y pie. */
export default function PortalLayout({ children }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const exit = async () => {
    setLeaving(true);
    await logout();
    navigate('/ingreso', { replace: true });
  };

  const tab = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-brand/10 text-brand' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/comprobantes" className="shrink-0" aria-label="Mis comprobantes">
            <Logo />
          </Link>
          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Secciones">
            {!user.mustChangePassword && (
              <NavLink to="/comprobantes" className={tab}>
                <FiFileText aria-hidden="true" /> Mis comprobantes
              </NavLink>
            )}
            <NavLink to="/perfil" className={tab}>
              <FiUser aria-hidden="true" /> Perfil
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <p className="max-w-[220px] truncate text-sm font-semibold text-ink">{user.fullName}</p>
              <p className="text-xs text-ink-faint tabular">{user.identification}</p>
            </div>
            <ThemeButton />
            <button
              type="button"
              onClick={exit}
              disabled={leaving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold text-ink-muted hover:text-danger"
            >
              <FiLogOut aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="flex gap-1 border-t px-3 py-2 md:hidden" aria-label="Secciones">
          {!user.mustChangePassword && (
            <NavLink to="/comprobantes" className={tab}>
              <FiFileText aria-hidden="true" /> Comprobantes
            </NavLink>
          )}
          <NavLink to="/perfil" className={tab}>
            <FiUser aria-hidden="true" /> Perfil
          </NavLink>
        </nav>
      </header>

      {user.usingDefaultPassword && !user.mustChangePassword && (
        <div className="border-b border-warn/20 bg-warn/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm text-warn sm:px-6">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="px-4 pb-6 text-center text-xs text-ink-faint">© {new Date().getFullYear()} FLUXOERP S.A.S.</footer>
    </div>
  );
}
