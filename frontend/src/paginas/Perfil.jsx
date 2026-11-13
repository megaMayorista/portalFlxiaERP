import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiInfo, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Field from '../componentes/Campo';
import { useToast } from '../contexto/AvisosContexto';
import { useSession } from '../contexto/SesionContexto';
import { api } from '../utilidades/api';
import { LIMITS, countCharacters } from '../utilidades/caracteres';
import { identificationKind } from '../utilidades/formato';

/** Perfil: nombre completo editable y cambio de contraseña, en dos tarjetas. */
export default function ProfilePage() {
  const { user } = useSession();
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h2 className="mb-5 font-display text-xl font-bold text-ink sm:text-2xl">Configuración de Perfil</h2>

      {user.mustChangePassword && (
        <p className="mb-5 flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          Ingresó con una contraseña temporal. Elija una contraseña propia para ver sus comprobantes.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <ProfileCard />
        <PasswordCard />
      </div>
    </div>
  );
}

function CardHeader({ icon: Icon, title, id }) {
  return (
    <div className="flex items-center gap-2.5 border-b px-5 py-4 sm:px-6">
      <Icon className="text-lg text-ink" aria-hidden="true" />
      <h3 id={id} className="font-display text-base font-bold text-ink">{title}</h3>
    </div>
  );
}

function ProfileCard() {
  const { user, update } = useSession();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api('/profile')
      .then((data) => {
        if (!alive) return;
        setProfile(data);
        setName(data.fullName);
      })
      .catch((err) => toast.error(err.message));
    return () => {
      alive = false;
    };
  }, [toast]);

  const changed = name.trim() !== (profile?.fullName ?? user.fullName);

  const save = async (event) => {
    event.preventDefault();
    if (countCharacters(name.trim()) < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await api('/profile', { method: 'PUT', body: { fullName: name.trim() } });
      setProfile(data);
      setName(data.fullName);
      update({ fullName: data.fullName });
      toast.success('Nombre actualizado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card overflow-hidden" aria-labelledby="titulo-perfil">
      <CardHeader icon={FiUser} title="Información del Perfil" id="titulo-perfil" />
      <form onSubmit={save} className="space-y-4 px-5 py-5 sm:px-6" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            Usuario ({identificationKind(user.identification) === 'RUC' ? 'RUC' : 'cédula'})
          </p>
          <p className="rounded-xl bg-surface-muted px-3.5 py-2.5 text-[15px] text-ink-muted tabular">{user.identification}</p>
        </div>
        <Field
          label="Nombre Completo"
          max={LIMITS.name}
          value={name}
          onChange={(value) => {
            setName(value);
            setError('');
          }}
          error={error}
          autoComplete="name"
        />
        {profile && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <FiMail className="mt-0.5 shrink-0" aria-hidden="true" />
            {profile.recoveryEmail ? (
              <span>
                Si olvida su contraseña, la temporal se envía a <strong className="text-ink">{profile.recoveryEmail}</strong>, el correo de su última factura.
              </span>
            ) : (
              <span>No tenemos un correo en sus facturas: si olvida su contraseña, volverá a ser su {identificationKind(user.identification)}.</span>
            )}
          </p>
        )}
        <div className="flex justify-end">
          <button type="submit" className="btn-navy" disabled={!changed || saving}>
            <FiCheck aria-hidden="true" /> {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordCard() {
  const { user, update } = useSession();
  const forced = user.mustChangePassword;
  const identification = user.identification;
  const toast = useToast();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#clave') {
      document.getElementById('clave')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const rules = [
    { ok: countCharacters(next) >= 8, label: 'Al menos 8 caracteres' },
    { ok: next.length > 0 && next !== identification, label: `Distinta de su ${identificationKind(identification)}` },
    { ok: forced || (next.length > 0 && next !== current), label: 'Distinta de la actual', hidden: forced },
    { ok: confirm.length > 0 && confirm === next, label: 'Las dos coinciden' },
  ].filter((rule) => !rule.hidden);
  const ready = rules.every((rule) => rule.ok) && (forced || current.length > 0);

  const submit = async (event) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError('');
    try {
      await api('/profile/password', {
        method: 'POST',
        body: { currentPassword: forced ? null : current, newPassword: next },
      });
      update({ usingDefaultPassword: false, mustChangePassword: false });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Contraseña actualizada. Las demás sesiones abiertas se cerraron.');
      if (forced) navigate('/comprobantes', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="clave" className="card scroll-mt-24 overflow-hidden" aria-labelledby="titulo-clave">
      <CardHeader icon={FiLock} title="Cambiar Contraseña" id="titulo-clave" />
      <form onSubmit={submit} className="space-y-3 px-5 py-5 sm:px-6" noValidate>
        {!forced && (
          <Field label="Contraseña Actual" mode="password" max={LIMITS.password} value={current} onChange={setCurrent} autoComplete="current-password" />
        )}
        <Field label="Nueva Contraseña" mode="password" max={LIMITS.password} value={next} onChange={setNext} autoComplete="new-password" />
        <Field label="Confirmar Nueva Contraseña" mode="password" max={LIMITS.password} value={confirm} onChange={setConfirm} autoComplete="new-password" />

        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? 'text-good' : 'text-ink-faint'}`}>
              <FiCheck className={rule.ok ? '' : 'opacity-30'} aria-hidden="true" /> {rule.label}
            </li>
          ))}
        </ul>

        {error && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</p>}

        <div className="flex flex-col-reverse items-stretch gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <FiInfo className="text-brand" aria-hidden="true" /> Usa una contraseña segura: letras, números y símbolos, sin espacios.
          </p>
          <button type="submit" className="btn-navy shrink-0" disabled={!ready || saving}>
            <FiLock aria-hidden="true" /> {saving ? 'Guardando…' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
