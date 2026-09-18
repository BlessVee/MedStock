import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PageHeader } from '../components/PageHeader';
import { useMedicineActions } from '../hooks/useMedicineActions';
import { useBatchActions } from '../hooks/useBatchActions';
import { exportCSV } from '../utils/csv';

export function Archive() {
  const { archivedMedicines, archivedBatches, medicineById } = useData();
  const medicineActions = useMedicineActions();
  const batchActions = useBatchActions();

  const archivedBatchRows = useMemo(
    () => archivedBatches.map((b) => ({ batch: b, medicine: medicineById(b.medicine_id) })),
    [archivedBatches, medicineById],
  );

  function exportMedicines() {
    exportCSV(
      archivedMedicines.map((m) => ({ name: m.name, category: m.category?.name ?? '—' })),
      [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
      ],
      'archived-medicines.csv',
    );
  }

  function exportBatches() {
    exportCSV(
      archivedBatchRows.map((r) => ({
        medicine: r.medicine?.name ?? '—',
        batchNumber: r.batch.batch_number,
        expiry: r.batch.expiry_date,
      })),
      [
        { key: 'medicine', label: 'Medicine' },
        { key: 'batchNumber', label: 'Batch #' },
        { key: 'expiry', label: 'Expiry' },
      ],
      'archived-batches.csv',
    );
  }

  return (
    <div>
      <PageHeader title="Archive" subtitle="Restore or permanently delete archived records" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Archived Medicines</div>
        <button className="btn" onClick={exportMedicines}>
          Export CSV
        </button>
      </div>
      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto', marginBottom: 26 }}>
        <table className="data-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {archivedMedicines.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td className="muted">{m.category?.name ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--primary)' }}
                      onClick={() => medicineActions.restore(m)}
                    >
                      Restore
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--bad-text)' }}
                      onClick={() => medicineActions.deleteForever(m)}
                    >
                      Delete Forever
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {archivedMedicines.length === 0 && (
          <div className="empty-state">No archived medicines.</div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Archived Batches</div>
        <button className="btn" onClick={exportBatches}>
          Export CSV
        </button>
      </div>
      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch #</th>
              <th>Expiry</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {archivedBatchRows.map(({ batch, medicine }) => (
              <tr key={batch.id}>
                <td style={{ fontWeight: 600 }}>{medicine?.name ?? '—'}</td>
                <td className="mono">{batch.batch_number}</td>
                <td className="mono">{batch.expiry_date}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--primary)' }}
                      onClick={() => batchActions.restore(batch)}
                    >
                      Restore
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--bad-text)' }}
                      onClick={() => batchActions.deleteForever(batch)}
                    >
                      Delete Forever
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {archivedBatchRows.length === 0 && <div className="empty-state">No archived batches.</div>}
      </div>
    </div>
  );
}
