import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { friendlyError } from '../lib/errors';
import {
  activeBatchNumberCollision,
  archiveBatch,
  batchHasTransactions,
  deleteBatchDirect,
  hardDeleteBatch,
  restoreBatch,
} from '../services/batches';
import { daysUntil } from '../utils/date';
import type { Batch } from '../types/database';

export interface BlockedDeleteState {
  name: string;
  entityLabel: 'batch';
  onArchive: () => void;
}

export function useBatchActions() {
  const { refetch } = useData();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [blocked, setBlocked] = useState<BlockedDeleteState | null>(null);

  async function archive(batch: Batch) {
    try {
      await archiveBatch(batch.id);
      toast('success', 'Batch archived.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function restore(batch: Batch) {
    try {
      if (daysUntil(batch.expiry_date) < 0) {
        const proceed = await confirm({
          title: 'Batch expired while archived',
          message: `Batch "${batch.batch_number}" expired on ${batch.expiry_date} while archived. Restore it anyway?`,
          confirmLabel: 'Restore Anyway',
          danger: true,
        });
        if (!proceed) return;
      }
      const collision = await activeBatchNumberCollision(
        batch.medicine_id,
        batch.batch_number,
        batch.id,
      );
      if (collision) {
        toast(
          'error',
          `Batch number "${batch.batch_number}" is already in use for this medicine — rename one before restoring.`,
        );
        return;
      }
      await restoreBatch(batch.id);
      toast('success', 'Batch restored.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function deleteAttempt(batch: Batch) {
    try {
      const hasHistory = await batchHasTransactions(batch.id);
      if (hasHistory) {
        setBlocked({
          name: batch.batch_number,
          entityLabel: 'batch',
          onArchive: () => archive(batch),
        });
        return;
      }
      const ok = await confirm({
        title: 'Delete batch?',
        message: `Permanently delete batch "${batch.batch_number}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      await deleteBatchDirect(batch.id);
      toast('success', 'Batch deleted.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function deleteForever(batch: Batch) {
    const ok = await confirm({
      title: 'Delete forever?',
      message: `Permanently delete batch "${batch.batch_number}" and its transaction history? This cannot be undone.`,
      confirmLabel: 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    try {
      await hardDeleteBatch(batch.id);
      toast('success', 'Batch permanently deleted.');
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
