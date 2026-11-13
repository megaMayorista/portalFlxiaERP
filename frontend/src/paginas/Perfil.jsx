import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiCreditCard, FiLock, FiMail, FiSave, FiShield, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Avatar from '../componentes/Avatar';
import Field from '../componentes/Campo';
import { useToast } from '../contexto/AvisosContexto';
import { useSession } from '../contexto/SesionContexto';
import { api } from '../utilidades/api';
import { LIMITS, countCharacters } from '../utilidades/caracteres';
import { identificationKind, titleCase } from '../utilidades/formato';

/** Mi perfil: portada con avatar, datos personales y seguridad de la cuenta. */
export default function ProfilePage() {
  const { user } = useSession();
  const kind = identificationKind(user.identification) === 'RUC' ? 'RUC' : 'Cédula';
  const secure = !user.usingDefaultPassword && !user.mustChangePassword;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[28px] border bg-surface shadow-soft">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-deep via-brand-sky to-ai sm:h-36">
          <div className="grid-hairline-light absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand-cyan/40 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
        </div>
        {/* relative z-10: el avatar sube sobre la portada y debe pintarse encima de ella. */}
        <div className="relative z-10 px-5 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Solo el avatar sube sobre la portada; el texto queda en la parte blanca. */}
            <div className="-mt-12 self-start rounded-[32px] bg-surface p-1.5">
              <Avatar name={user.fullName} size="xl" />
            </div>
            <div className="min-w-0 flex-1 sm:pb-1 sm:pt-4">
              <p className="eyebrow text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Mi perfil
              </p>
              <h1 className="mt-1 break-words font-display text-2xl font-bold text-ink sm:text-3xl">{titleCase(user.fullName)}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip bg-surface-sunken text-ink-muted">
                  <FiCreditCard aria-hidden="true" /> {kind} {user.identification}
                </span>
                <span className={`chip ${secure ? 'bg-good/10 text-good' : 'bg-accent/10 text-accent'}`}>
                  <FiShield aria-hidden="true" /> {secure ? 'Contraseña propia' : `Su contraseña es su ${kind === 'RUC' ? 'RUC' : 'cédula'}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user.mustChangePassword && (
        <p className="flex items-start gap-2 rounded-2xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
          <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
          Ingresó con una contraseña temporal. Elija una contraseña propia para ver sus comprobantes.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DataCard />
        <SecurityCard />
      </div>
    </div>
  );
}

function CardTitle({ icon: Icon, eyebrow, title, tone = 'brand', id }) {
  const tones = { brand: 'bg-brand/10 text-brand', accent: 'bg-accent/10 text-accent' };
  return (
    <div className="flex items-center gap-3.5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${tones[tone]}`}>
        <Icon aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{eyebrow}</p>
        <h2 id={id} className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>
    </div>
  );
}

function DataCard() {
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
    <section className="card rounded-[24px] p-5 sm:p-7" aria-labelledby="titulo-datos">
      <CardTitle icon={FiUser} eyebrow="Datos" title="Información personal" id="titulo-datos" />
      <form onSubmit={save} className="mt-6 space-y-4" noValidate>
        <Field
          label="Nombre completo"
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
          <div className="flex items-start gap-3 rounded-2xl bg-surface-muted px-4 py-3">
            <FiMail className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-ink-muted">
              {profile.recoveryEmail ? (
                <>
                  Si olvida su contraseña, la temporal llega a <strong className="text-ink">{profile.recoveryEmail}</strong>, el
                  correo de su última factura.
                </>
              ) : (
                <>No tenemos un correo en sus facturas: si olvida su contraseña, volverá a ser su {identificationKind(user.identification)}.</>
              )}
            </p>
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button type="submit" className="btn-primary" disabled={!changed || saving}>
            <FiSave aria-hidden="true" /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}

/** 0 a 4: largo, más largo, letras con números, símbolos. */
function strengthOf(password) {
  if (!password) return 0;
  return [
    countCharacters(password) >= 8,
    countCharacters(password) >= 12,
    /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(password) && /\d/.test(password),
    /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(password),
  ].filter(Boolean).length;
}

const STRENGTH = [
  { label: 'Escriba una contraseña', color: 'bg-surface-sunken', text: 'text-ink-faint' },
  { label: 'Débil', color: 'bg-danger', text: 'text-danger' },
  { label: 'Regular', color: 'bg-accent', text: 'text-accent' },
  { label: 'Buena', color: 'bg-brand', text: 'text-brand' },
  { label: 'Fuerte', color: 'bg-good', text: 'text-good' },
];

function SecurityCard() {
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

  const score = strengthOf(next);
  const level = STRENGTH[score];
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
    <section id="clave" className="card scroll-mt-24 rounded-[24px] p-5 sm:p-7" aria-labelledby="titulo-clave">
      <CardTitle icon={FiLock} eyebrow="Seguridad" title="Contraseña de acceso" tone="accent" id="titulo-clave" />
      <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
        {!forced && (
          <Field label="Contraseña actual" mode="password" max={LIMITS.password} value={current} onChange={setCurrent} autoComplete="current-password" />
        )}
        <Field label="Nueva contraseña" mode="password" max={LIMITS.password} value={next} onChange={setNext} autoComplete="new-password" />

        <div aria-live="polite">
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((bar) => (
              <span key={bar} className={`h-1.5 flex-1 rounded-full transition-colors ${score >= bar ? level.color : 'bg-surface-sunken'}`} />
            ))}
          </div>
          <p className={`mt-1.5 text-xs font-semibold ${level.text}`}>Seguridad: {level.label}</p>
        </div>

        <Field label="Repita la nueva contraseña" mode="password" max={LIMITS.password} value={confirm} onChange={setConfirm} autoComplete="new-password" />

        <ul className="grid gap-1.5 rounded-2xl bg-surface-muted px-4 py-3 text-xs sm:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? 'text-good' : 'text-ink-faint'}`}>
              <FiCheck className={rule.ok ? '' : 'opacity-30'} aria-hidden="true" /> {rule.label}
            </li>
          ))}
        </ul>

        {error && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</p>}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">Combine letras, números y símbolos. Sin espacios.</p>
          <button type="submit" className="btn-primary shrink-0" disabled={!ready || saving}>
            <FiLock aria-hidden="true" /> {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
