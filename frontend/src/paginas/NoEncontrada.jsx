import { Link } from 'react-router-dom';
import Logo from '../componentes/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size="lg" />
      <div>
        <p className="font-display text-6xl font-bold text-brand">404</p>
        <h1 className="mt-2 text-xl font-bold text-ink">Esta página no existe</h1>
        <p className="mt-1 text-sm text-ink-muted">Revise la dirección o vuelva al inicio.</p>
      </div>
      <Link to="/" className="btn-primary">Ir al portal</Link>
    </div>
  );
}
