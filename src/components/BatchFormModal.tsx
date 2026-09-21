import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { createBatch } from '../services/batches';
import { friendlyError } from '../lib/errors';
import { minFutureDateStr } from '../utils/date';
import type { Batch } from '../types/database';

interface Props {
  // Fixed medicine (opened from a medicine's own page, or from the stock-in
  // flow where a medicine is already selected). Omit both to show a medicine
  // picker instead — used when adding a batch directly from the Batches page.
  medicineId?: string;
  medicineName?: string;
  onClose: () => void;
  // When provided, called with the newly created batch instead of just
  // closing — lets the stock-in flow auto-select the batch it just created.
  onCreated?: (batch: Batch) => void;
}

export function BatchFormModal({
  medicineId: fixedMedicineId,
  medicineName,
  onClose,
  onCreated,
}: Props) {
  const { activeMedicines, refetch } = useData();
  const { toast } = useToast();
  const [medicineId, setMedicineId] = useState(fixedMedicineId ?? '');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const minDate = minFutureDateStr();
  const pickMedicine = !fixedMedicineId;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pickMedicine && !medicineId) return toast('error', 'Select a medicine.');
    const trimmed = batchNumber.trim();
    if (!trimmed) return toast('error', 'Batch number is required.');
    if (!expiry) return toast('error', 'Expiry date is required.');
    if (expiry < minDate) return toast('error', 'Expiry date must be in the future.');

    setSubmitting(true);
    try {
      const batch = await createBatch({
        medicine_id: medicineId,
        batch_number: trimmed,
        expiry_date: expiry,
      });
      toast('success', 'Batch added.');
      await refetch();
      if (onCreated) onCreated(batch);
      else onClose();
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
          {pickMedicine ? 'Add Batch' : `Add Batch — ${medicineName}`}
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pickMedicine && (
            <div className="field">
              <label htmlFor="batch-medicine">Medicine</label>
              <select
                id="batch-medicine"
                className="input"
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                autoFocus
              >
                <option value="">Select medicine…</option>
                {activeMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="batch-number">Batch number</label>
            <input
              id="batch-number"
              className="input"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. B-2026-0142"
              autoFocus={!pickMedicine}
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
