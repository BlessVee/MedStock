import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { StockTxnModal } from '../components/StockTxnModal';
import { WriteOffModal } from '../components/WriteOffModal';
import { BlockedDeleteModal } from '../components/BlockedDeleteModal';
import { BatchFormModal } from '../components/BatchFormModal';
import { useBatchActions } from '../hooks/useBatchActions';
import { exportCSV } from '../utils/csv';
import type { Batch } from '../types/database';

type TxnModalState = { type: 'IN' | 'OUT'; medicineId: string; batchId: string } | null;
type WriteOffState = { batchId: string; batchNumber: string } | null;

export function Batches() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBatches, medicineById, batchStock, batchExpiryStatus } = useData();
  const { archive, deleteAttempt, blocked, closeBlocked } = useBatchActions();

  const [search, setSearch] = useState('');
  const [expiryStatus, setExpiryStatus] = useState(searchParams.get('expiryStatus') ?? 'all');
  const [txnModal, setTxnModal] = useState<TxnModalState>(null);
  const [writeOff, setWriteOff] = useState<WriteOffState>(null);
  const [addingBatch, setAddingBatch] = useState(false);

  const rows = useMemo(() => {
    return activeBatches
      .map((b) => ({ batch: b, medicine: medicineById(b.medicine_id) }))
      .filter((r) => r.medicine && r.medicine.archived_at === null)
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.medicine!.name.toLowerCase().includes(q) ||
          r.batch.batch_number.toLowerCase().includes(q)
        );
      })
      .filter((r) => {
        if (expiryStatus === 'all') return true;
        return batchExpiryStatus(r.batch, r.medicine!.expiry_warning_days).key === expiryStatus;
      })
      .map((r) => ({
        ...r,
        stock: batchStock(r.batch.id),
        status: batchExpiryStatus(r.batch, r.medicine!.expiry_warning_days),
      }));
  }, [activeBatches, medicineById, search, expiryStatus, batchStock, batchExpiryStatus]);

  function handleExport() {
    exportCSV(
      rows.map((r) => ({
        medicine: r.medicine!.name,
        batchNumber: r.batch.batch_number,
        expiry: r.batch.expiry_date,
        stock: r.stock,
        status: r.status.label,
      })),
      [
        { key: 'medicine', label: 'Medicine' },
        { key: 'batchNumber', label: 'Batch #' },
        { key: 'expiry', label: 'Expiry' },
        { key: 'stock', label: 'Stock' },
        { key: 'status', label: 'Status' },
      ],
      'batches.csv',
    );
  }

  function openTxn(type: 'IN' | 'OUT', batch: Batch) {
    setTxnModal({ type, medicineId: batch.medicine_id, batchId: batch.id });
  }

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle="All batches across every medicine"
        primaryAction={{ label: '+ Add Batch', onClick: () => setAddingBatch(true) }}
        secondaryAction={{ label: 'Export CSV', onClick: handleExport }}
      />

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by medicine or batch #…"
        />
        <select
          className="input"
          value={expiryStatus}
          onChange={(e) => setExpiryStatus(e.target.value)}
        >
          <option value="all">All expiry statuses</option>
          <option value="ok">OK</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch #</th>
              <th>Expiry</th>
              <th className="num">Stock</th>
              <th>Status</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ batch, medicine, stock, status }) => (
              <tr key={batch.id}>
                <td
                  style={{ fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => navigate(`/medicines/${medicine!.id}`)}
                >
                  {medicine!.name}
                </td>
                <td className="mono muted">{batch.batch_number}</td>
                <td className="mono">{batch.expiry_date}</td>
                <td className="num mono">{stock}</td>
                <td>
                  <StatusBadge status={status} />
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
                      onClick={() => openTxn('IN', batch)}
                    >
                      In
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--info-text)' }}
                      onClick={() => openTxn('OUT', batch)}
                    >
                      Out
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--warn-text)' }}
                      onClick={() =>
                        setWriteOff({ batchId: batch.id, batchNumber: batch.batch_number })
                      }
                    >
                      Write-off
                    </button>
                    <button className="btn-ghost muted" onClick={() => archive(batch)}>
                      Archive
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--bad-text)' }}
                      onClick={() => deleteAttempt(batch)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state">No batches match these filters.</div>}
      </div>

      {txnModal && (
        <StockTxnModal
          txnType={txnModal.type}
          medicineId={txnModal.medicineId}
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
      {addingBatch && <BatchFormModal onClose={() => setAddingBatch(false)} />}
    </div>
  );
}
