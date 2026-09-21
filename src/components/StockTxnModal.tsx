import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { BatchFormModal } from './BatchFormModal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  createStockTransaction,
  deriveUnitAndTotal,
  type PriceEntryMode,
} from '../services/transactions';
import { fmtMoney } from '../utils/format';
import { friendlyError } from '../lib/errors';

interface Props {
  txnType: 'IN' | 'OUT';
  medicineId?: string;
  batchId?: string;
  onClose: () => void;
}

export function StockTxnModal({
  txnType,
  medicineId: initialMedicineId,
  batchId: initialBatchId,
  onClose,
}: Props) {
  const { activeMedicines, medicineById, batchesForMedicine, batchStock, refetch } = useData();
  const { toast } = useToast();

  const [medicineId, setMedicineId] = useState(initialMedicineId ?? '');
  const [batchId, setBatchId] = useState(initialBatchId ?? '');
  const [qty, setQty] = useState('');
  const [priceMode, setPriceMode] = useState<PriceEntryMode>('unit');
  const [price, setPrice] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);

  const medicine = medicineById(medicineId);
  const batchOptions = useMemo(
    () => (medicineId ? batchesForMedicine(medicineId, true) : []),
    [medicineId, batchesForMedicine],
  );

  const isIn = txnType === 'IN';
  const title = medicine
    ? `${isIn ? 'Stock In' : 'Stock Out'} — ${medicine.name}`
    : isIn
      ? 'Stock In'
      : 'Stock Out';
  const priceKind = isIn ? 'Cost Price' : 'Sale Price';

  const quantityNum = Number(qty);
  const priceNum = Number(price);
  const derivedPreview =
    Number.isFinite(quantityNum) &&
    quantityNum > 0 &&
    Number.isFinite(priceNum) &&
    price.trim() !== ''
      ? deriveUnitAndTotal(priceMode, priceNum, quantityNum)
      : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!medicineId) return toast('error', 'Select a medicine.');
    if (!batchId) return toast('error', 'Select a batch.');
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0)
      return toast('error', 'Quantity must be greater than 0.');
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0)
      return toast('error', 'Price must be 0 or more.');
    if (!isIn) {
      const stock = batchStock(batchId);
      if (quantity > stock)
        return toast('error', `Quantity exceeds current batch stock (${stock}).`);
    }

    setSubmitting(true);
    try {
      await createStockTransaction({
        batch_id: batchId,
        type: txnType,
        quantity,
        priceMode,
        priceValue,
        reference: reference.trim(),
        notes: notes.trim(),
      });
      toast('success', isIn ? 'Stock in recorded.' : 'Stock out recorded.');
      await refetch();
      onClose();
    } catch (err) {
      toast('error', friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid var(--border)',
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          {title}
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="txn-medicine">Medicine</label>
            <select
              id="txn-medicine"
              className="input"
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                setBatchId('');
              }}
              disabled={!!initialMedicineId}
            >
              <option value="">Select medicine…</option>
              {activeMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <label htmlFor="txn-batch">Batch</label>
              {medicineId && !initialBatchId && (
                <button
                  type="button"
                  onClick={() => setAddingBatch(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  + Add new batch
                </button>
              )}
            </div>
            <select
              id="txn-batch"
              className="input"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={!!initialBatchId}
            >
              <option value="">Select batch…</option>
              {batchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_number} · exp {b.expiry_date} · stock {batchStock(b.id)}
                </option>
              ))}
            </select>
            {medicineId && batchOptions.length === 0 && (
              <div className="faint" style={{ fontSize: 12 }}>
                No active batches for this medicine yet — add one to continue.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="txn-qty">Quantity</label>
              <input
                id="txn-qty"
                type="number"
                className="input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <label htmlFor="txn-price">{priceKind}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['unit', 'total'] as const).map((mode) => {
                    const active = priceMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPriceMode(mode)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'var(--primary-soft)' : 'var(--surface)',
                          color: active ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {mode === 'unit' ? 'Per unit' : 'Total'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                id="txn-price"
                type="number"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {derivedPreview && (
                <div className="faint" style={{ fontSize: 11.5 }}>
                  {priceMode === 'unit'
                    ? `Total: ${fmtMoney(derivedPreview.total)}`
                    : `Per unit: ${fmtMoney(derivedPreview.unit)}`}
                </div>
              )}
            </div>
          </div>
          <div className="field">
            <label htmlFor="txn-reference">Reference</label>
            <input
              id="txn-reference"
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO / invoice / sale ref…"
            />
          </div>
          <div className="field">
            <label htmlFor="txn-notes">Notes</label>
            <textarea
              id="txn-notes"
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div
          style={{
            padding: '16px 22px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {isIn ? 'Add Stock' : 'Remove Stock'}
          </button>
        </div>
      </form>
      {addingBatch && medicine && (
        <BatchFormModal
          medicineId={medicine.id}
          medicineName={medicine.name}
          onClose={() => setAddingBatch(false)}
          onCreated={(batch) => {
            setBatchId(batch.id);
            setAddingBatch(false);
          }}
        />
      )}
    </Modal>
  );
}
