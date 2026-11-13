import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PortalLayout from './componentes/DisposicionPortal';
import Logo from './componentes/Logo';
import { useSession } from './contexto/SesionContexto';
import LoginPage from './paginas/Ingreso';
import DocumentsPage from './paginas/MisComprobantes';
import ErrorPage from './paginas/PaginaError';
import ProfilePage from './paginas/Perfil';
import RecoverPage from './paginas/RecuperarClave';
import { setForbiddenHandler } from './utilidades/api';

/**
 * nginx serves its own errors (blocked attacks, probes, the API opened in the
 * browser) with copies of index.html that carry <meta name="portal-error">.
 * Then the app shows that view whatever the address is, so a 403 or 404 always
 * looks the same.
 */
const FORCED_ERROR = (() => {
  const code = Number(document.querySelector('meta[name="portal-error"]')?.getAttribute('content'));
  return code === 403 || code === 404 ? code : null;
})();

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
    </div>
  );
}

/**
 * Pages that need a session. With a temporary password only the profile is
 * reachable, until it is changed (the backend enforces the same rule).
 */
function Protected({ children, allowWhileForced = false }) {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/ingreso" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && !allowWhileForced) return <Navigate to="/perfil" replace />;
  return <PortalLayout>{children}</PortalLayout>;
}

function Home() {
  const { user, loading } = useSession();
  if (loading) return <Loading />;
  return <Navigate to={user ? '/comprobantes' : '/ingreso'} replace />;
}

export default function App() {
  const { loading } = useSession();
  const navigate = useNavigate();

  // An API 403 (FORBIDDEN) takes the person to the 403 view.
  useEffect(() => {
    setForbiddenHandler(() => navigate('/acceso-denegado', { replace: true }));
  }, [navigate]);

  if (FORCED_ERROR) return <ErrorPage code={FORCED_ERROR} />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ingreso" element={loading ? <Loading /> : <LoginPage />} />
      <Route path="/recuperar" element={loading ? <Loading /> : <RecoverPage />} />
      <Route path="/comprobantes" element={<Protected><DocumentsPage /></Protected>} />
      <Route path="/perfil" element={<Protected allowWhileForced><ProfilePage /></Protected>} />
      <Route path="/acceso-denegado" element={<ErrorPage code={403} />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  );
}
