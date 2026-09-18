import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { MedicineFormModal } from '../components/MedicineFormModal';
import { StockTxnModal } from '../components/StockTxnModal';
import { BlockedDeleteModal } from '../components/BlockedDeleteModal';
import { useMedicineActions } from '../hooks/useMedicineActions';
import { exportCSV } from '../utils/csv';
import type { MedicineWithCategory } from '../types/database';

type TxnModalState = { type: 'IN' | 'OUT'; medicineId: string } | null;

export function Medicines() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeMedicines, categories, medicineStock, medicineStockStatus, medicineExpiryStatus } =
    useData();
  const { archive, deleteAttempt, blocked, closeBlocked } = useMedicineActions();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState(searchParams.get('stockStatus') ?? 'all');
  const [formTarget, setFormTarget] = useState<MedicineWithCategory | 'add' | null>(null);
  const [txnModal, setTxnModal] = useState<TxnModalState>(null);

  const rows = useMemo(() => {
    return activeMedicines
      .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
      .filter((m) => category === 'all' || m.category_id === category)
      .filter((m) => stockStatus === 'all' || medicineStockStatus(m).key === stockStatus)
      .map((m) => ({
        medicine: m,
        stock: medicineStock(m.id),
        stockStatus: medicineStockStatus(m),
        expiryStatus: medicineExpiryStatus(m),
      }));
  }, [
    activeMedicines,
    search,
    category,
    stockStatus,
    medicineStock,
    medicineStockStatus,
    medicineExpiryStatus,
  ]);

  function handleExport() {
    exportCSV(
      rows.map((r) => ({
        name: r.medicine.name,
        category: r.medicine.category?.name ?? '—',
        stock: r.stock,
        minStock: r.medicine.minimum_stock,
        status: r.stockStatus.label,
        expiry: r.expiryStatus.label,
      })),
      [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'Stock' },
        { key: 'minStock', label: 'Min' },
        { key: 'status', label: 'Status' },
        { key: 'expiry', label: 'Expiry' },
      ],
      'medicines.csv',
    );
  }

  return (
    <div>
      <PageHeader
        title="Medicines"
        subtitle="Search, filter, and manage medicine records"
        primaryAction={{ label: '+ Add Medicine', onClick: () => setFormTarget('add') }}
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
          placeholder="Search medicines…"
        />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
        >
          <option value="all">All stock statuses</option>
          <option value="available">Available</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 880 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className="num">Stock</th>
              <th className="num">Min</th>
              <th>Status</th>
              <th>Expiry</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ medicine, stock, stockStatus: ss, expiryStatus }) => (
              <tr key={medicine.id}>
                <td
                  style={{ fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => navigate(`/medicines/${medicine.id}`)}
                >
                  {medicine.name}
                </td>
                <td className="muted">{medicine.category?.name ?? '—'}</td>
                <td className="num mono">{stock}</td>
                <td className="num mono muted">{medicine.minimum_stock}</td>
                <td>
                  <StatusBadge status={ss} />
                </td>
                <td>
                  <StatusBadge status={expiryStatus} />
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
                      onClick={() => setTxnModal({ type: 'IN', medicineId: medicine.id })}
                    >
                      Stock In
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--info-text)' }}
                      onClick={() => setTxnModal({ type: 'OUT', medicineId: medicine.id })}
                    >
                      Stock Out
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--primary)' }}
                      onClick={() => navigate(`/medicines/${medicine.id}`)}
                    >
                      Batches
                    </button>
                    <button className="btn-ghost muted" onClick={() => setFormTarget(medicine)}>
                      Edit
                    </button>
                    <button className="btn-ghost muted" onClick={() => archive(medicine)}>
                      Archive
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--bad-text)' }}
                      onClick={() => deleteAttempt(medicine)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state">No medicines match these filters.</div>}
      </div>

      {formTarget && (
        <MedicineFormModal
          medicine={formTarget === 'add' ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}
      {txnModal && (
        <StockTxnModal
          txnType={txnModal.type}
          medicineId={txnModal.medicineId}
          onClose={() => setTxnModal(null)}
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
    </div>
  );
}
