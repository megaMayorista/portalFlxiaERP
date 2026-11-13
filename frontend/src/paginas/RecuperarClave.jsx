import { useState } from 'react';
import { FiAlertCircle, FiArrowLeft, FiCreditCard, FiMail, FiRefreshCw, FiShield } from 'react-icons/fi';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Field from '../componentes/Campo';
import AccessLayout from '../componentes/DisposicionAcceso';
import { useSession } from '../contexto/SesionContexto';
import { api } from '../utilidades/api';
import { LIMITS } from '../utilidades/caracteres';
import { identificationKind } from '../utilidades/formato';
import { useSupport } from '../utilidades/soporte';

/**
 * Recuperar contraseña:
 *  - con correo en sus facturas → contraseña temporal a ese correo;
 *  - sin correo → la contraseña vuelve a ser su RUC o cédula.
 */
export default function RecoverPage() {
  const { user } = useSession();
  const location = useLocation();
  const support = useSupport();
  const [identification, setIdentification] = useState(location.state?.identification || '');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  if (user) return <Navigate to="/comprobantes" replace />;

  const valid = identification.length === 10 || identification.length === 13;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError('');
    try {
      const data = await api('/auth/recover', { method: 'POST', body: { identification }, silent401: true });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (result) {
    const byEmail = result.channel === 'EMAIL';
    return (
      <AccessLayout>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-good/10 text-2xl text-good">
            {byEmail ? <FiMail aria-hidden="true" /> : <FiShield aria-hidden="true" />}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-ink">{byEmail ? 'Revise su correo' : 'Contraseña restablecida'}</h2>
          {byEmail ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Enviamos una contraseña temporal a <strong className="text-ink">{result.maskedEmail}</strong>, el correo
              de su última factura. Vence en {result.temporaryPasswordHours} horas y al ingresar se le pedirá cambiarla.
              Su contraseña anterior sigue funcionando.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              No tenemos un correo registrado en sus facturas, así que su contraseña volvió a ser su{' '}
              {identificationKind(identification)}: <strong className="text-ink">{identification}</strong>. Al ingresar,
              cámbiela por una propia en Perfil.
            </p>
          )}
          {byEmail && (
            <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-xs leading-relaxed text-ink-muted">
              ¿No le llegó? Revise la carpeta de spam o comuníquese con soporte al{' '}
              <a href={`https://wa.me/${support.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                {support.phone}
              </a>
              .
            </p>
          )}
          <Link to="/ingreso" state={{ identification }} className="btn-primary mt-6 w-full py-3">
            Ir a iniciar sesión
          </Link>
        </div>
      </AccessLayout>
    );
  }

  return (
    <AccessLayout>
      <Link to="/ingreso" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <FiArrowLeft aria-hidden="true" /> Volver
      </Link>
      <h2 className="mt-3 text-2xl font-bold text-ink">¿Olvidó su contraseña?</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        Ingrese su RUC o cédula. Si sus facturas tienen un correo, le enviaremos una contraseña temporal; si no, su
        contraseña volverá a ser su RUC o cédula.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
        <Field
          label="RUC o cédula"
          placeholder="Ej. 1712345678"
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
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full py-3" disabled={!valid || sending}>
          <FiRefreshCw className={sending ? 'animate-spin' : ''} aria-hidden="true" />
          {sending ? 'Procesando…' : 'Recuperar contraseña'}
        </button>
      </form>
    </AccessLayout>
  );
}
