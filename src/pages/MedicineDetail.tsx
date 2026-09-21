import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { StatusBadge } from '../components/StatusBadge';
import { MedicineFormModal } from '../components/MedicineFormModal';
import { BatchFormModal } from '../components/BatchFormModal';
import { StockTxnModal } from '../components/StockTxnModal';
import { WriteOffModal } from '../components/WriteOffModal';
import { BlockedDeleteModal } from '../components/BlockedDeleteModal';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { useBatchActions } from '../hooks/useBatchActions';
import { deleteTransaction, listTransactionsForBatchIds } from '../services/transactions';
import type { Transaction, Batch } from '../types/database';
import { TXN_TYPE } from '../domain/status';
import { addDays, fmtDateTime, todayStr } from '../utils/date';
import { fmtMoney } from '../utils/format';
import { exportCSV } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { friendlyError } from '../lib/errors';

type TxnModalState = { type: 'IN' | 'OUT'; batchId: string } | null;
type WriteOffState = { batchId: string; batchNumber: string } | null;
type RangeKey = '7' | '30' | '90' | '365' | 'custom';

export function MedicineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirm = useConfirm();
  const {
    medicineById,
    batchesForMedicine,
    batchStock,
    batchExpiryStatus,
    medicineStock,
    medicineStockStatus,
  } = useData();
  const { archive, deleteAttempt, blocked, closeBlocked } = useBatchActions();

  const medicine = id ? medicineById(id) : undefined;
  const batches = id ? batchesForMedicine(id, true) : [];

  const [editing, setEditing] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);
  const [txnModal, setTxnModal] = useState<TxnModalState>(null);
  const [writeOff, setWriteOff] = useState<WriteOffState>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  function loadTransactions() {
    if (!id) return;
    const allBatchIds = batchesForMedicine(id, false).map((b: Batch) => b.id);
    listTransactionsForBatchIds(allBatchIds)
      .then(setTransactions)
      .catch((err) => toast('error', friendlyError(err, 'Could not load transaction history.')));
  }

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, batches.length]);

  async function handleDeleteTxn(t: Transaction) {
    const ok = await confirm({
      title: 'Delete transaction?',
      message: `Permanently delete this ${TXN_TYPE[t.type].label} of ${t.quantity}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction(t.id);
      toast('success', 'Transaction deleted.');
      loadTransactions();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  const batchNumberById = useMemo(() => {
    const all = id ? batchesForMedicine(id, false) : [];
    return new Map(all.map((b) => [b.id, b.batch_number]));
  }, [id, batchesForMedicine]);

  const history = useMemo(() => {
    const today = new Date(todayStr());
    let from: Date | null = null;
    let to: Date = today;
    if (rangeKey === 'custom') {
      if (customFrom) from = new Date(customFrom);
      if (customTo) to = new Date(customTo);
    } else {
      from = addDays(today, -Number(rangeKey));
    }
    return transactions
      .filter((t) => {
        const d = new Date(t.created_at);
        if (from && d < from) return false;
        if (to && d > addDays(to, 1)) return false;
        return true;
      })
      .map((t) => ({
        ...t,
        batchNumber: batchNumberById.get(t.batch_id) ?? '—',
        unitPrice: t.type === 'IN' ? t.unit_cost_price : t.unit_sale_price,
        totalPrice: t.type === 'IN' ? t.total_cost_price : t.total_sale_price,
      }));
  }, [transactions, rangeKey, customFrom, customTo, batchNumberById]);

  const chipDefs: { key: RangeKey; label: string }[] = [
    { key: '7', label: '7d' },
    { key: '30', label: '30d' },
    { key: '90', label: '90d' },
    { key: '365', label: '1y' },
    { key: 'custom', label: 'Custom' },
  ];

  function exportHistory() {
    exportCSV(
      history.map((h) => ({
        date: fmtDateTime(h.created_at),
        batch: h.batchNumber,
        type: TXN_TYPE[h.type].label,
        qty: h.quantity,
        unitPrice: fmtMoney(h.unitPrice),
        totalPrice: fmtMoney(h.totalPrice),
        reference: h.reference ?? '—',
        notes: h.notes ?? '',
      })),
      [
        { key: 'date', label: 'Date' },
        { key: 'batch', label: 'Batch' },
        { key: 'type', label: 'Type' },
        { key: 'qty', label: 'Qty' },
        { key: 'unitPrice', label: 'Unit Price' },
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'reference', label: 'Reference' },
        { key: 'notes', label: 'Notes' },
      ],
      `${medicine!.name}-history.csv`,
    );
  }

  if (!medicine) {
    return (
      <div className="empty-state">
        Medicine not found.{' '}
        <button className="btn" onClick={() => navigate('/medicines')}>
          Back to Medicines
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/medicines')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← All medicines
      </button>

      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{medicine.name}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {medicine.category?.name ?? '—'} · Min stock {medicine.minimum_stock} · Expiry warning{' '}
            {medicine.expiry_warning_days}d
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={medicineStockStatus(medicine)} />
          <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>
            {medicineStock(medicine.id)}
          </div>
          <button className="btn" onClick={() => setEditing(true)}>
            Edit Medicine
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Batches</div>
        <button
          className="btn btn-primary"
          style={{ padding: '6px 12px' }}
          onClick={() => setAddingBatch(true)}
        >
          + Add Batch
        </button>
      </div>
      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto', marginBottom: 28 }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Expiry</th>
              <th className="num">Stock</th>
              <th>Status</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="mono" style={{ fontWeight: 600 }}>
                  {b.batch_number}
                </td>
                <td className="mono">{b.expiry_date}</td>
                <td className="num mono">{batchStock(b.id)}</td>
                <td>
                  <StatusBadge status={batchExpiryStatus(b, medicine.expiry_warning_days)} />
                </td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--good-text)' }}
                      onClick={() => setTxnModal({ type: 'IN', batchId: b.id })}
                    >
                      In
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--info-text)' }}
                      onClick={() => setTxnModal({ type: 'OUT', batchId: b.id })}
                    >
                      Out
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--warn-text)' }}
                      onClick={() => setWriteOff({ batchId: b.id, batchNumber: b.batch_number })}
                    >
                      Write-off
                    </button>
                    <button className="btn-ghost muted" onClick={() => archive(b)}>
                      Archive
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--bad-text)' }}
                      onClick={() => deleteAttempt(b)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length === 0 && (
          <div className="empty-state">No active batches. Add one to get started.</div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Transaction history</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {chipDefs.map((chip) => {
            const active = rangeKey === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setRangeKey(chip.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'var(--primary-soft)' : 'var(--surface)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {chip.label}
              </button>
            );
          })}
          <button className="btn" style={{ marginLeft: 4 }} onClick={exportHistory}>
            Export CSV
          </button>
        </div>
      </div>
      {rangeKey === 'custom' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <input
            type="date"
            className="input"
            style={{ width: 'auto' }}
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <span className="faint" style={{ fontSize: 12.5 }}>
            to
          </span>
          <input
            type="date"
            className="input"
            style={{ width: 'auto' }}
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
        </div>
      )}
      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Batch</th>
              <th>Type</th>
              <th className="num">Qty</th>
              <th className="num">Unit Price</th>
              <th className="num">Total Price</th>
              <th>Reference</th>
              <th>Notes</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => {
              const type = TXN_TYPE[h.type];
              return (
                <tr key={h.id}>
                  <td className="mono muted">{fmtDateTime(h.created_at)}</td>
                  <td className="mono">{h.batchNumber}</td>
                  <td>
                    <span className="badge" style={{ background: type.bg, color: type.text }}>
                      {type.label}
                    </span>
                  </td>
                  <td className="num mono">{h.quantity}</td>
                  <td className="num mono">{fmtMoney(h.unitPrice)}</td>
                  <td className="num mono">{fmtMoney(h.totalPrice)}</td>
                  <td className="muted">{h.reference ?? '—'}</td>
                  <td className="muted">{h.notes ?? ''}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => setEditingTxn(h)}>
                        Edit
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ color: 'var(--bad-text)' }}
                        onClick={() => handleDeleteTxn(h)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 && <div className="empty-state">No transactions in this range.</div>}
      </div>

      {editing && <MedicineFormModal medicine={medicine} onClose={() => setEditing(false)} />}
      {addingBatch && (
        <BatchFormModal
          medicineId={medicine.id}
          medicineName={medicine.name}
          onClose={() => setAddingBatch(false)}
        />
      )}
      {txnModal && (
        <StockTxnModal
          txnType={txnModal.type}
          medicineId={medicine.id}
          batchId={txnModal.batchId}
          onClose={() => setTxnModal(null)}
        />
      )}
      {writeOff && (
        <WriteOffModal
          batchId={writeOff.batchId}
          batchNumber={writeOff.batchNumber}
          onClose={() => setWriteOff(null)}
        />
      )}
      {blocked && (
        <BlockedDeleteModal
          name={blocked.name}
          entityLabel={blocked.entityLabel}
          onArchive={blocked.onArchive}
          onClose={closeBlocked}
        />
      )}
      {editingTxn && (
        <EditTransactionModal
          transaction={editingTxn}
          batchLabel={batchNumberById.get(editingTxn.batch_id) ?? '—'}
          onClose={() => {
            setEditingTxn(null);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}
