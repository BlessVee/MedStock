import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { useToast } from '../context/ToastContext';
import {
  DashboardIcon,
  MedicineIcon,
  BatchesIcon,
  LedgerIcon,
  CategoriesIcon,
  ArchiveIcon,
  SettingsIcon,
  PanelToggleIcon,
  LogoutIcon,
} from './icons';

interface NavDef {
  to: string;
  label: string;
  icon: (props: { size?: number }) => React.ReactElement;
  badgeCount: number;
  badgeTone: 'warn' | 'bad';
}

const MOBILE_BREAKPOINT = 768;
const EXPANDED_WIDTH = 230;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY = 'medstock-sidebar-collapsed';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { activeMedicines, activeBatches, medicineStockStatus, batchExpiryStatus, medicineById } =
    useData();
  const { session } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

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
    { to: '/', label: 'Dashboard', icon: DashboardIcon, badgeCount: 0, badgeTone: 'warn' },
    {
      to: '/medicines',
      label: 'Medicines',
      icon: MedicineIcon,
      badgeCount: lowOutCount,
      badgeTone: 'warn',
    },
    {
      to: '/batches',
      label: 'Batches',
      icon: BatchesIcon,
      badgeCount: expiringExpiredCount,
      badgeTone: 'bad',
    },
    { to: '/ledger', label: 'Ledger', icon: LedgerIcon, badgeCount: 0, badgeTone: 'warn' },
    {
      to: '/categories',
      label: 'Categories',
      icon: CategoriesIcon,
      badgeCount: 0,
      badgeTone: 'warn',
    },
    { to: '/archive', label: 'Archive', icon: ArchiveIcon, badgeCount: 0, badgeTone: 'warn' },
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

  // On mobile, an expanded sidebar overlays content as a drawer instead of
  // pushing it, since there isn't room to show both side by side.
  const overlay = isMobile && !collapsed;

  return (
    <>
      {overlay && (
        <div
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,26,0.4)', zIndex: 40 }}
        />
      )}
      <aside
        style={{
          width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          flex: 'none',
          background: 'var(--surface-alt)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.18s ease',
          overflow: 'hidden',
          ...(overlay
            ? ({
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: EXPANDED_WIDTH,
                zIndex: 50,
                boxShadow: 'var(--shadow-lg)',
              } as CSSProperties)
            : {}),
        }}
      >
        <div
          style={{
            padding: collapsed ? '18px 0 14px' : '22px 16px 18px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
            {!collapsed && (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                MedStock
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse menu"
              aria-label="Collapse menu"
              style={iconButtonStyle}
            >
              <PanelToggleIcon size={15} />
            </button>
          )}
        </div>

        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Expand menu"
              aria-label="Expand menu"
              style={iconButtonStyle}
            >
              <PanelToggleIcon size={15} />
            </button>
          </div>
        )}

        <nav
          style={{
            flex: 1,
            padding: collapsed ? '10px 8px' : '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            overflowY: 'auto',
          }}
        >
          {!collapsed && (
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
          )}
          {navDefs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'space-between', position: 'relative' }}
                onClick={() => {
                  if (overlay) setCollapsed(true);
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </span>
                {item.badgeCount > 0 && !collapsed && (
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
                {item.badgeCount > 0 && collapsed && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 10,
                      width: 7,
                      height: 7,
                      borderRadius: '100%',
                      background: item.badgeTone === 'bad' ? 'var(--bad-text)' : 'var(--warn-text)',
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: collapsed ? '10px 8px' : '14px 16px' }}>
          <button
            className="btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={onOpenSettings}
            title="Settings"
          >
            <SettingsIcon size={16} />
            {!collapsed && 'Settings'}
          </button>
        </div>

        <div
          style={{
            margin: collapsed ? '0 8px 12px' : '0 14px 14px',
            padding: collapsed ? '10px 6px' : '11px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            gap: collapsed ? 8 : 9,
          }}
        >
          <div
            title={collapsed ? email || 'Signed in' : undefined}
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
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                title={email}
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
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Pharmacy Staff
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            style={{
              flex: 'none',
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-alt)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LogoutIcon size={14} />
          </button>
        </div>
      </aside>
    </>
  );
}
