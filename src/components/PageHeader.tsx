import type { ReactNode } from 'react';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, primaryAction, secondaryAction }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 22,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.01em' }}>
          {title}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {secondaryAction && (
          <button className="btn btn-secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </button>
        )}
        {primaryAction && (
          <button className="btn btn-primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
