import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  deriveUnitAndTotal,
  updateStockTransaction,
  updateWriteOff,
  type PriceEntryMode,
} from '../services/transactions';
import { fmtMoney } from '../utils/format';
import { friendlyError } from '../lib/errors';
import type { Transaction } from '../types/database';

interface Props {
  transaction: Transaction;
  batchLabel: string;
  onClose: () => void;
}

export function EditTransactionModal({ transaction, batchLabel, onClose }: Props) {
  const { batchStock, refetch } = useData();
  const { toast } = useToast();

  const isWriteOff = transaction.type === 'WRITE_OFF';
  const isIn = transaction.type === 'IN';
  const initialPrice = isIn ? transaction.unit_cost_price : transaction.unit_sale_price;

  const [qty, setQty] = useState(String(transaction.quantity));
  const [priceMode, setPriceMode] = useState<PriceEntryMode>('unit');
  const [price, setPrice] = useState(initialPrice != null ? String(initialPrice) : '');
  const [reference, setReference] = useState(transaction.reference ?? '');
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const priceKind = isIn ? 'Cost Price' : 'Sale Price';
  const quantityNum = Number(qty);
  const priceNum = Number(price);
  const derivedPreview =
    !isWriteOff &&
    Number.isFinite(quantityNum) &&
    quantityNum > 0 &&
    Number.isFinite(priceNum) &&
    price.trim() !== ''
      ? deriveUnitAndTotal(priceMode, priceNum, quantityNum)
      : null;

  // Stock currently already reflects this transaction's original effect —
  // recompute what stock would be after swapping in the new quantity, same
  // sign convention as batch_stock (IN adds, OUT/WRITE_OFF subtracts).
  function stockAfterEdit(newQuantity: number): number {
    const currentStock = batchStock(transaction.batch_id);
    const sign = transaction.type === 'IN' ? 1 : -1;
    return currentStock + sign * (newQuantity - transaction.quantity);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0)
      return toast('error', 'Quantity must be greater than 0.');
    if (stockAfterEdit(quantity) < 0)
      return toast('error', 'This change would take the batch below 0 stock.');

    setSubmitting(true);
    try {
      if (isWriteOff) {
        await updateWriteOff({ id: transaction.id, quantity, notes: notes.trim() });
      } else {
        const priceValue = Number(price);
        if (!Number.isFinite(priceValue) || priceValue < 0)
          return toast('error', 'Price must be 0 or more.');
        await updateStockTransaction({
          id: transaction.id,
          type: transaction.type as 'IN' | 'OUT',
          quantity,
          priceMode,
          priceValue,
          reference: reference.trim(),
          notes: notes.trim(),
        });
      }
      toast('success', 'Transaction updated.');
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
          Edit Transaction
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {batchLabel} ·{' '}
            {transaction.type === 'IN'
              ? 'Stock In'
              : transaction.type === 'OUT'
                ? 'Stock Out'
                : 'Write-Off'}{' '}
            — batch and type can't be changed here.
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="edit-qty">Quantity</label>
              <input
                id="edit-qty"
                type="number"
                className="input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            {!isWriteOff && (
              <div className="field" style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <label htmlFor="edit-price">{priceKind}</label>
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
                  id="edit-price"
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
            )}
          </div>
          {!isWriteOff && (
            <div className="field">
              <label htmlFor="edit-reference">Reference</label>
              <input
                id="edit-reference"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="PO / invoice / sale ref…"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
