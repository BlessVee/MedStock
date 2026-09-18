import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StockTxnModal } from '../components/StockTxnModal';
import { listLedgerTransactions, type TransactionWithNames } from '../services/transactions';
import { TXN_TYPE } from '../domain/status';
import { fmtDateTime } from '../utils/date';
import { fmtMoney } from '../utils/format';
import { exportCSV } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/errors';

export function Ledger() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TransactionWithNames[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [modal, setModal] = useState<'IN' | 'OUT' | null>(null);

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
        price: fmtMoney(t.type === 'IN' ? t.cost_price : t.sale_price),
        reference: t.reference ?? '—',
        notes: t.notes ?? '',
      })),
      [
        { key: 'date', label: 'Date' },
        { key: 'medicine', label: 'Medicine' },
        { key: 'batch', label: 'Batch' },
        { key: 'type', label: 'Type' },
        { key: 'qty', label: 'Qty' },
        { key: 'price', label: 'Price' },
        { key: 'reference', label: 'Reference' },
        { key: 'notes', label: 'Notes' },
      ],
      'ledger.csv',
    );
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
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Medicine</th>
              <th>Batch</th>
              <th>Type</th>
              <th className="num">Qty</th>
              <th className="num">Price</th>
              <th>Reference</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const meta = TXN_TYPE[t.type];
              const price = t.type === 'IN' ? t.cost_price : t.sale_price;
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
                  <td className="num mono">{fmtMoney(price)}</td>
                  <td className="muted">{t.reference ?? '—'}</td>
                  <td className="muted">{t.notes ?? ''}</td>
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
    </div>
  );
}
