import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { friendlyError } from '../lib/errors';
import {
  activeNameCollision,
  archiveMedicine,
  deleteMedicineDirect,
  hardDeleteMedicine,
  medicineHasBatches,
  restoreMedicine,
} from '../services/medicines';
import type { MedicineWithCategory } from '../types/database';

export interface BlockedDeleteState {
  name: string;
  entityLabel: 'medicine';
  onArchive: () => void;
}

export function useMedicineActions() {
  const { refetch } = useData();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [blocked, setBlocked] = useState<BlockedDeleteState | null>(null);

  async function archive(medicine: MedicineWithCategory) {
    try {
      await archiveMedicine(medicine.id);
      toast('success', 'Medicine archived.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function restore(medicine: MedicineWithCategory) {
    try {
      const collision = await activeNameCollision(medicine.name, medicine.id);
      if (collision) {
        toast(
          'error',
          `A medicine named "${medicine.name}" already exists — rename one before restoring this one.`,
        );
        return;
      }
      await restoreMedicine(medicine.id);
      toast('success', 'Medicine restored.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function deleteAttempt(medicine: MedicineWithCategory) {
    try {
      const hasHistory = await medicineHasBatches(medicine.id);
      if (hasHistory) {
        setBlocked({
          name: medicine.name,
          entityLabel: 'medicine',
          onArchive: () => archive(medicine),
        });
        return;
      }
      const ok = await confirm({
        title: 'Delete medicine?',
        message: `Permanently delete "${medicine.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      await deleteMedicineDirect(medicine.id);
      toast('success', 'Medicine deleted.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function deleteForever(medicine: MedicineWithCategory) {
    const ok = await confirm({
      title: 'Delete forever?',
      message: `Permanently delete "${medicine.name}" and all its batches and transaction history? This cannot be undone.`,
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    try {
      await hardDeleteMedicine(medicine.id);
      toast('success', 'Medicine permanently deleted.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  return {
    archive,
    restore,
    deleteAttempt,
    deleteForever,
    blocked,
    closeBlocked: () => setBlocked(null),
  };
}
