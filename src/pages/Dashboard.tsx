import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StockTxnModal } from '../components/StockTxnModal';
import { listRecentTransactions, type TransactionWithNames } from '../services/transactions';
import { TXN_TYPE } from '../domain/status';
import { fmtDateTime } from '../utils/date';
import { fmtMoney } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/errors';

export function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    activeMedicines,
    activeBatches,
    medicineStock,
    medicineStockStatus,
    batchExpiryStatus,
    medicineById,
  } = useData();
  const [recent, setRecent] = useState<TransactionWithNames[]>([]);
  const [modal, setModal] = useState<'IN' | 'OUT' | null>(null);

  function loadRecent() {
    listRecentTransactions(8)
      .then(setRecent)
      .catch((err) => toast('error', friendlyError(err, 'Could not load recent activity.')));
  }

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStock = activeMedicines.reduce((sum, m) => sum + medicineStock(m.id), 0);
  const lowOutCount = activeMedicines.filter(
    (m) => medicineStockStatus(m).key !== 'available',
  ).length;
  const expiringExpiredBatches = activeBatches.filter((b) => {
    const medicine = medicineById(b.medicine_id);
    if (!medicine) return false;
    const status = batchExpiryStatus(b, medicine.expiry_warning_days).key;
    return status === 'expiring' || status === 'expired';
  });
  const expiredCount = expiringExpiredBatches.filter((b) => {
    const medicine = medicineById(b.medicine_id)!;
    return batchExpiryStatus(b, medicine.expiry_warning_days).key === 'expired';
  }).length;
  const expiringCount = expiringExpiredBatches.length - expiredCount;
  const hasAlerts = expiringExpiredBatches.length > 0 || lowOutCount > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of stock, batches and expiry"
        primaryAction={{ label: '+ Stock In', onClick: () => setModal('IN') }}
        secondaryAction={{ label: '+ Stock Out', onClick: () => setModal('OUT') }}
      />

      {hasAlerts && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            background: 'var(--warn-bg)',
            border: '1px solid var(--warn-text)',
            borderRadius: 9,
            padding: '13px 18px',
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 13.5, color: 'var(--warn-text)', fontWeight: 600 }}>
            {expiredCount} batch(es) expired, {expiringCount} expiring soon, and {lowOutCount}{' '}
            medicine(s) low or out of stock.
          </div>
          <button
            className="btn"
            style={{
              borderColor: 'var(--warn-text)',
              color: 'var(--warn-text)',
              background: 'transparent',
            }}
            onClick={() => navigate('/batches?expiryStatus=expiring')}
          >
            Review expiry alerts
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total Medicines"
          value={activeMedicines.length}
          sub="active medicines"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          label="Total Batches"
          value={activeBatches.length}
          sub="across all medicines"
          onClick={() => navigate('/batches')}
        />
        <StatCard
          label="Total Stock"
          value={totalStock}
          sub="units on hand"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          label="Low / Out of Stock"
          value={lowOutCount}
          sub="medicines need reorder"
          color={lowOutCount > 0 ? 'var(--warn-text)' : 'var(--text)'}
          onClick={() => navigate('/medicines?stockStatus=low')}
        />
        <StatCard
          label="Expiring / Expired"
          value={expiringExpiredBatches.length}
          sub={`${expiredCount} expired · ${expiringCount} expiring`}
          color={expiringExpiredBatches.length > 0 ? 'var(--bad-text)' : 'var(--text)'}
          onClick={() => navigate('/batches?expiryStatus=expiring')}
        />
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Recent activity</div>
      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Medicine</th>
              <th>Type</th>
              <th className="num">Qty</th>
              <th className="num">Unit Price</th>
              <th className="num">Total Price</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => {
              const type = TXN_TYPE[t.type];
              const unitPrice = t.type === 'IN' ? t.unit_cost_price : t.unit_sale_price;
              const totalPrice = t.type === 'IN' ? t.total_cost_price : t.total_sale_price;
              return (
                <tr key={t.id}>
                  <td className="mono muted">{fmtDateTime(t.created_at)}</td>
                  <td>{t.batch?.medicine?.name ?? '—'}</td>
                  <td>
                    <span className="badge" style={{ background: type.bg, color: type.text }}>
                      {type.label}
                    </span>
                  </td>
                  <td className="num mono">{t.quantity}</td>
                  <td className="num mono">{fmtMoney(unitPrice)}</td>
                  <td className="num mono">{fmtMoney(totalPrice)}</td>
                  <td className="muted">{t.reference ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {recent.length === 0 && <div className="empty-state">No transactions yet.</div>}
      </div>

      {modal && (
        <StockTxnModal
          txnType={modal}
          onClose={() => {
            setModal(null);
            loadRecent();
          }}
        />
      )}
    </div>
  );
}
