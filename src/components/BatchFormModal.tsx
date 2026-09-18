import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { createBatch } from '../services/batches';
import { friendlyError } from '../lib/errors';
import { minFutureDateStr } from '../utils/date';

interface Props {
  medicineId: string;
  medicineName: string;
  onClose: () => void;
}

export function BatchFormModal({ medicineId, medicineName, onClose }: Props) {
  const { refetch } = useData();
  const { toast } = useToast();
  const [batchNumber, setBatchNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const minDate = minFutureDateStr();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = batchNumber.trim();
    if (!trimmed) return toast('error', 'Batch number is required.');
    if (!expiry) return toast('error', 'Expiry date is required.');
    if (expiry < minDate) return toast('error', 'Expiry date must be in the future.');

    setSubmitting(true);
    try {
      await createBatch({ medicine_id: medicineId, batch_number: trimmed, expiry_date: expiry });
      toast('success', 'Batch added.');
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
          Add Batch — {medicineName}
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="batch-number">Batch number</label>
            <input
              id="batch-number"
              className="input"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. B-2026-0142"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="batch-expiry">Expiry date</label>
            <input
              id="batch-expiry"
              type="date"
              className="input"
              min={minDate}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
          <div className="faint" style={{ fontSize: 12 }}>
            New batches start at 0 stock — use Stock In afterward to record the opening quantity.
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
            Add Batch
          </button>
        </div>
      </form>
    </Modal>
  );
}
