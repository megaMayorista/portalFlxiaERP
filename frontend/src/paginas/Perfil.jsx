import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiLock, FiMail, FiSave, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Field from '../componentes/Campo';
import { useToast } from '../contexto/AvisosContexto';
import { useSession } from '../contexto/SesionContexto';
import { api } from '../utilidades/api';
import { LIMITS, countCharacters } from '../utilidades/caracteres';
import { identificationKind } from '../utilidades/formato';

/** Perfil: nombre completo editable y cambio de contraseña. */
export default function ProfilePage() {
  const { user, update } = useSession();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState(user.fullName);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

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

  useEffect(() => {
    if (window.location.hash === '#clave') {
      document.getElementById('clave')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const nameLength = countCharacters(name.trim());
  const nameChanged = name.trim() !== (profile?.fullName ?? user.fullName);

  const saveName = async (event) => {
    event.preventDefault();
    if (nameLength < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const data = await api('/profile', { method: 'PUT', body: { fullName: name.trim() } });
      setProfile(data);
      setName(data.fullName);
      update({ fullName: data.fullName });
      toast.success('Nombre actualizado.');
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Perfil</h1>
        <p className="mt-1 text-sm text-ink-muted">Sus datos de acceso al portal.</p>
      </div>

      {user.mustChangePassword && (
        <p className="flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          Ingresó con una contraseña temporal. Elija una contraseña propia para ver sus comprobantes.
        </p>
      )}

      <section className="card p-5 sm:p-6" aria-labelledby="datos">
        <h2 id="datos" className="flex items-center gap-2 text-lg font-bold text-ink">
          <FiUser className="text-brand" aria-hidden="true" /> Datos
        </h2>
        <form onSubmit={saveName} className="mt-4 space-y-3" noValidate>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Usuario ({identificationKind(user.identification) === 'RUC' ? 'RUC' : 'cédula'})</p>
            <p className="rounded-xl bg-surface-muted px-3.5 py-2.5 text-[15px] text-ink-muted tabular">{user.identification}</p>
          </div>
          <Field
            label="Nombre completo"
            max={LIMITS.name}
            value={name}
            onChange={(value) => {
              setName(value);
              setNameError('');
            }}
            error={nameError}
            autoComplete="name"
          />
          {profile && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <FiMail className="mt-0.5 shrink-0" aria-hidden="true" />
              {profile.recoveryEmail
                ? <>Si olvida su contraseña, la temporal se envía a <strong className="text-ink">{profile.recoveryEmail}</strong>, el correo de su última factura.</>
                : <>No tenemos un correo en sus facturas: si olvida su contraseña, volverá a ser su {identificationKind(user.identification)}.</>}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={!nameChanged || savingName}>
              <FiSave aria-hidden="true" /> {savingName ? 'Guardando…' : 'Guardar nombre'}
            </button>
          </div>
        </form>
      </section>

      <PasswordSection forced={user.mustChangePassword} identification={user.identification} />
    </div>
  );
}

function PasswordSection({ forced, identification }) {
  const { update } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const nextLength = countCharacters(next);
  const rules = [
    { ok: nextLength >= 8, label: 'Al menos 8 caracteres' },
    { ok: next.length > 0 && next !== identification, label: `Distinta de su ${identificationKind(identification)}` },
    { ok: forced || (next.length > 0 && next !== current), label: 'Distinta de la actual', hidden: forced },
    { ok: confirm.length > 0 && confirm === next, label: 'Las dos contraseñas coinciden' },
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
    <section id="clave" className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby="titulo-clave">
      <h2 id="titulo-clave" className="flex items-center gap-2 text-lg font-bold text-ink">
        <FiLock className="text-brand" aria-hidden="true" /> Cambiar contraseña
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Puede usar letras, números y símbolos. No se admiten espacios.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        {!forced && (
          <Field label="Contraseña actual" mode="password" max={LIMITS.password} value={current} onChange={setCurrent} autoComplete="current-password" />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nueva contraseña" mode="password" max={LIMITS.password} value={next} onChange={setNext} autoComplete="new-password" />
          <Field label="Repita la nueva contraseña" mode="password" max={LIMITS.password} value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-2 ${rule.ok ? 'text-good' : 'text-ink-faint'}`}>
              <FiCheck className={rule.ok ? '' : 'opacity-30'} aria-hidden="true" /> {rule.label}
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={!ready || saving}>
            <FiLock aria-hidden="true" /> {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
