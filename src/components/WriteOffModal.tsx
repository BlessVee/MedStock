import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { createWriteOff } from '../services/transactions';
import { friendlyError } from '../lib/errors';

interface Props {
  batchId: string;
  batchNumber: string;
  onClose: () => void;
}

export function WriteOffModal({ batchId, batchNumber, onClose }: Props) {
  const { batchStock, refetch } = useData();
  const { toast } = useToast();
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentStock = batchStock(batchId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0)
      return toast('error', 'Quantity must be greater than 0.');
    if (quantity > currentStock)
      return toast('error', `Quantity exceeds current batch stock (${currentStock}).`);

    setSubmitting(true);
    try {
      await createWriteOff({ batch_id: batchId, quantity, notes: notes.trim() });
      toast('success', 'Stock written off.');
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
            color: 'var(--bad-text)',
          }}
        >
          Write Off Stock
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {batchNumber} · current stock {currentStock}
          </div>
          <div className="field">
            <label htmlFor="wo-qty">Quantity to write off</label>
            <input
              id="wo-qty"
              type="number"
              className="input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="wo-notes">Reason / notes</label>
            <textarea
              id="wo-notes"
              className="input"
              rows={2}
              placeholder="Damaged, expired, lost…"
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
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            Write Off
          </button>
        </div>
      </form>
    </Modal>
  );
}
