interface StatCardProps {
  label: string;
  value: number | string;
  sub: string;
  color?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, sub, color = 'var(--text)', onClick }: StatCardProps) {
  return (
    <div
      className="card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
      style={{ cursor: onClick ? 'pointer' : 'default', padding: '16px 17px' }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div
        className="mono"
        style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', color }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
