import { useToast } from '../context/ToastContext';

const DOT_COLOR: Record<string, string> = {
  success: 'var(--good-text)',
  error: 'var(--bad-text)',
  info: 'var(--info-text)',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 1200,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '12px 14px',
            width: 320,
            animation: 'toastIn .18s ease',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 100,
              marginTop: 5,
              flex: 'none',
              background: DOT_COLOR[t.kind],
            }}
          />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
            {t.message}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              fontSize: 15,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
