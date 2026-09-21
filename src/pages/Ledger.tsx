import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StockTxnModal } from '../components/StockTxnModal';
import { EditTransactionModal } from '../components/EditTransactionModal';
import {
  deleteTransaction,
  listLedgerTransactions,
  type TransactionWithNames,
} from '../services/transactions';
import { TXN_TYPE } from '../domain/status';
import { fmtDateTime } from '../utils/date';
import { fmtMoney } from '../utils/format';
import { exportCSV } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { friendlyError } from '../lib/errors';

export function Ledger() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<TransactionWithNames[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [modal, setModal] = useState<'IN' | 'OUT' | null>(null);
  const [editing, setEditing] = useState<TransactionWithNames | null>(null);

  function load() {
    listLedgerTransactions()
      .then(setRows)
      .catch((err) => toast('error', friendlyError(err, 'Could not load the ledger.')));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((t) => type === 'all' || t.type === type)
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const hay =
          `${t.batch?.medicine?.name ?? ''} ${t.batch?.batch_number ?? ''} ${t.reference ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, search, type]);

  function handleExport() {
    exportCSV(
      filtered.map((t) => ({
        date: fmtDateTime(t.created_at),
        medicine: t.batch?.medicine?.name ?? '—',
        batch: t.batch?.batch_number ?? '—',
        type: TXN_TYPE[t.type].label,
        qty: t.quantity,
        unitPrice: fmtMoney(t.type === 'IN' ? t.unit_cost_price : t.unit_sale_price),
        totalPrice: fmtMoney(t.type === 'IN' ? t.total_cost_price : t.total_sale_price),
        reference: t.reference ?? '—',
        notes: t.notes ?? '',
      })),
      [
        { key: 'date', label: 'Date' },
        { key: 'medicine', label: 'Medicine' },
        { key: 'batch', label: 'Batch' },
        { key: 'type', label: 'Type' },
        { key: 'qty', label: 'Qty' },
        { key: 'unitPrice', label: 'Unit Price' },
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'reference', label: 'Reference' },
        { key: 'notes', label: 'Notes' },
      ],
      'ledger.csv',
    );
  }

  async function handleDelete(t: TransactionWithNames) {
    const ok = await confirm({
      title: 'Delete transaction?',
      message: `Permanently delete this ${TXN_TYPE[t.type].label} of ${t.quantity} for ${t.batch?.medicine?.name ?? 'this medicine'}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction(t.id);
      toast('success', 'Transaction deleted.');
      load();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Transaction Ledger"
        subtitle="Every stock movement, clinic-wide"
        primaryAction={{ label: '+ Stock In', onClick: () => setModal('IN') }}
        secondaryAction={{ label: '+ Stock Out', onClick: () => setModal('OUT') }}
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
          placeholder="Search medicine, batch, reference…"
        />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="WRITE_OFF">Write-Off</option>
        </select>
        <button className="btn" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Medicine</th>
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
            {filtered.map((t) => {
              const meta = TXN_TYPE[t.type];
              const unitPrice = t.type === 'IN' ? t.unit_cost_price : t.unit_sale_price;
              const totalPrice = t.type === 'IN' ? t.total_cost_price : t.total_sale_price;
              return (
                <tr key={t.id}>
                  <td className="mono muted">{fmtDateTime(t.created_at)}</td>
                  <td>{t.batch?.medicine?.name ?? '—'}</td>
                  <td className="mono muted">{t.batch?.batch_number ?? '—'}</td>
                  <td>
                    <span className="badge" style={{ background: meta.bg, color: meta.text }}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="num mono">{t.quantity}</td>
                  <td className="num mono">{fmtMoney(unitPrice)}</td>
                  <td className="num mono">{fmtMoney(totalPrice)}</td>
                  <td className="muted">{t.reference ?? '—'}</td>
                  <td className="muted">{t.notes ?? ''}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => setEditing(t)}>
                        Edit
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ color: 'var(--bad-text)' }}
                        onClick={() => handleDelete(t)}
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
        {filtered.length === 0 && (
          <div className="empty-state">No transactions match these filters.</div>
        )}
      </div>

      {modal && (
        <StockTxnModal
          txnType={modal}
          onClose={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {editing && (
        <EditTransactionModal
          transaction={editing}
          batchLabel={`${editing.batch?.medicine?.name ?? '—'} · ${editing.batch?.batch_number ?? '—'}`}
          onClose={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
