import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { createStockTransaction } from '../services/transactions';
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
  const [price, setPrice] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
  const priceLabel = isIn ? 'Cost Price' : 'Sale Price';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!medicineId) return toast('error', 'Select a medicine.');
    if (!batchId) return toast('error', 'Select a batch.');
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0)
      return toast('error', 'Quantity must be greater than 0.');
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0)
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
        price: priceNum,
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
            <label htmlFor="txn-batch">Batch</label>
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
              <label htmlFor="txn-price">{priceLabel}</label>
              <input
                id="txn-price"
                type="number"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
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
    </Modal>
  );
}
