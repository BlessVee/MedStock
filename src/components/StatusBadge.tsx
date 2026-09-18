import type { StatusMeta } from '../domain/status';

export function StatusBadge({ status }: { status: StatusMeta }) {
  return (
    <span className="badge" style={{ background: status.bg, color: status.text }}>
      {status.label}
    </span>
  );
}
