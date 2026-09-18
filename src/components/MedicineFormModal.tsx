import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { createMedicine, updateMedicine } from '../services/medicines';
import { friendlyError } from '../lib/errors';
import type { MedicineWithCategory } from '../types/database';

interface Props {
  medicine?: MedicineWithCategory;
  onClose: () => void;
}

export function MedicineFormModal({ medicine, onClose }: Props) {
  const { categories, refetch } = useData();
  const { toast } = useToast();
  const isEdit = !!medicine;

  const [name, setName] = useState(medicine?.name ?? '');
  const [categoryId, setCategoryId] = useState(medicine?.category_id ?? categories[0]?.id ?? '');
  const [minStock, setMinStock] = useState(String(medicine?.minimum_stock ?? 10));
  const [warnDays, setWarnDays] = useState(String(medicine?.expiry_warning_days ?? 60));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return toast('error', 'Medicine name is required.');
    if (!categoryId) return toast('error', 'Select a category.');
    const minimumStock = Number(minStock);
    const warningDays = Number(warnDays);
    if (!Number.isFinite(minimumStock) || minimumStock < 0) {
      return toast('error', 'Minimum stock must be 0 or more.');
    }
    if (!Number.isFinite(warningDays) || warningDays <= 0) {
      return toast('error', 'Expiry warning days must be greater than 0.');
    }

    setSubmitting(true);
    try {
      const input = {
        name: trimmedName,
        category_id: categoryId,
        minimum_stock: minimumStock,
        expiry_warning_days: warningDays,
      };
      if (isEdit) {
        await updateMedicine(medicine.id, input);
        toast('success', 'Medicine updated.');
      } else {
        await createMedicine(input);
        toast('success', 'Medicine added.');
      }
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
          {isEdit ? `Editing "${medicine!.name}"` : 'Add Medicine'}
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="med-name">Medicine name</label>
            <input
              id="med-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="med-category">Category</label>
            <select
              id="med-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="med-min">Minimum stock</label>
              <input
                id="med-min"
                type="number"
                className="input"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="med-warn">Expiry warning (days)</label>
              <input
                id="med-warn"
                type="number"
                className="input"
                value={warnDays}
                onChange={(e) => setWarnDays(e.target.value)}
              />
            </div>
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
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
