import { useState } from 'react';
import { FiAlertCircle, FiCreditCard, FiLock, FiLogIn } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Field from '../componentes/Campo';
import AccessLayout from '../componentes/DisposicionAcceso';
import { useSession } from '../contexto/SesionContexto';
import { LIMITS } from '../utilidades/caracteres';

/** Login: usuario = RUC o cédula. La primera vez, la contraseña también. */
export default function LoginPage() {
  const { user, login, expired, clearExpired } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [identification, setIdentification] = useState(location.state?.identification || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (user) {
    return <Navigate to={user.mustChangePassword ? '/perfil' : '/comprobantes'} replace />;
  }

  const valid = (identification.length === 10 || identification.length === 13) && password.length > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError('');
    clearExpired();
    try {
      const data = await login(identification, password);
      navigate(data.mustChangePassword ? '/perfil' : '/comprobantes', { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setSending(false);
    }
  };

  return (
    <AccessLayout>
      <h2 className="text-2xl font-bold text-ink">Iniciar sesión</h2>
      <p className="mt-1.5 text-sm text-ink-muted">Descargue el PDF y el XML de sus comprobantes electrónicos.</p>

      {/* En celular el panel de la izquierda no se ve: el aviso del primer ingreso va aquí. */}
      <p className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted lg:hidden">
        Si va a ingresar por primera vez al portal, el usuario y contraseña es su RUC o Cédula.
      </p>

      {expired && !error && (
        <p className="mt-4 rounded-xl bg-warn/10 px-3.5 py-2.5 text-sm text-warn">Su sesión terminó. Ingrese de nuevo.</p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
        <Field
          label="Usuario"
          placeholder="RUC o cédula"
          mode="digits"
          max={LIMITS.identification}
          icon={FiCreditCard}
          value={identification}
          onChange={(value) => {
            setIdentification(value);
            setError('');
          }}
          autoComplete="username"
          autoFocus
        />
        <Field
          label="Contraseña"
          placeholder="Su contraseña"
          mode="password"
          max={LIMITS.password}
          icon={FiLock}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError('');
          }}
          autoComplete="current-password"
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={!valid || sending}>
          <FiLogIn aria-hidden="true" />
          {sending ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          to="/recuperar"
          state={{ identification }}
          className="text-sm font-semibold text-brand hover:underline"
        >
          ¿Olvidó su contraseña?
        </Link>
      </div>
    </AccessLayout>
  );
}
