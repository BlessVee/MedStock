import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from '../components/Modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    setOptions(null);
    resolver.current?.(value);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal onClose={() => settle(false)} width={420}>
          <div style={{ padding: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{options.title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {options.message}
            </div>
          </div>
          <div
            style={{
              padding: '16px 22px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button className="btn btn-secondary" onClick={() => settle(false)}>
              {options.cancelLabel ?? 'Cancel'}
            </button>
            <button
              className={options.danger ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={() => settle(true)}
              autoFocus
            >
              {options.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
