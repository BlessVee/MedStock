import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { useToast } from '../context/ToastContext';

interface NavDef {
  to: string;
  label: string;
  badgeCount: number;
  badgeTone: 'warn' | 'bad';
}

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { activeMedicines, activeBatches, medicineStockStatus, batchExpiryStatus, medicineById } =
    useData();
  const { session } = useAuth();
  const { toast } = useToast();

  const lowOutCount = activeMedicines.filter(
    (m) => medicineStockStatus(m).key !== 'available',
  ).length;
  const expiringExpiredCount = activeBatches.filter((b) => {
    const medicine = medicineById(b.medicine_id);
    if (!medicine) return false;
    const status = batchExpiryStatus(b, medicine.expiry_warning_days).key;
    return status === 'expiring' || status === 'expired';
  }).length;

  const navDefs: NavDef[] = [
    { to: '/', label: 'Dashboard', badgeCount: 0, badgeTone: 'warn' },
    { to: '/medicines', label: 'Medicines', badgeCount: lowOutCount, badgeTone: 'warn' },
    { to: '/batches', label: 'Batches', badgeCount: expiringExpiredCount, badgeTone: 'bad' },
    { to: '/ledger', label: 'Ledger', badgeCount: 0, badgeTone: 'warn' },
    { to: '/categories', label: 'Categories', badgeCount: 0, badgeTone: 'warn' },
    { to: '/archive', label: 'Archive', badgeCount: 0, badgeTone: 'warn' },
  ];

  const email = session?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';

  async function handleLogout() {
    try {
      await signOut();
    } catch {
      toast('error', 'Could not log out. Please try again.');
    }
  }

  return (
    <aside
      style={{
        width: 230,
        flex: 'none',
        background: 'var(--surface-alt)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 800,
              flex: 'none',
            }}
          >
            M
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>MedStock</div>
        </div>
      </div>
      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '.07em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            padding: '0 10px 7px',
          }}
        >
          Menu
        </div>
        {navDefs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{item.label}</span>
            {item.badgeCount > 0 && (
              <span
                className="nav-badge"
                style={{
                  background: item.badgeTone === 'bad' ? 'var(--bad-bg)' : 'var(--warn-bg)',
                  color: item.badgeTone === 'bad' ? 'var(--bad-text)' : 'var(--warn-text)',
                }}
              >
                {item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '14px 16px' }}>
        <button className="btn" style={{ width: '100%' }} onClick={onOpenSettings}>
          Settings
        </button>
      </div>
      <div
        style={{
          margin: '0 14px 14px',
          padding: '11px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 100,
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12.5,
            fontWeight: 800,
            flex: 'none',
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {email || 'Signed in'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pharmacy Staff</div>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          style={{
            flex: 'none',
            padding: '5px 9px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface-alt)',
            color: 'var(--text-muted)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
