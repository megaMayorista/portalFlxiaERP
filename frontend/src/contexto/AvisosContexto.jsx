import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

/** Small notices in a corner (download failed, profile saved...). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (message, tone = 'info') => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), info: (m) => show(m, 'info') }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-rise-in items-start gap-3 rounded-xl border bg-surface p-3.5 text-sm text-ink shadow-card"
          >
            {toast.tone === 'error' ? (
              <FiAlertCircle className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
            ) : (
              <FiCheckCircle className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
            )}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-ink-faint hover:text-ink"
              aria-label="Cerrar aviso"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
