import type { BatchExpiryStatusKey } from '../types/database';
import { daysUntil, todayStr } from '../utils/date';

export type StockStatusKey = 'available' | 'low' | 'out';

export interface StatusMeta {
  key: string;
  label: string;
  bg: string;
  text: string;
}

export const STOCK_STATUS: Record<StockStatusKey, StatusMeta> = {
  available: {
    key: 'available',
    label: 'Available',
    bg: 'var(--good-bg)',
    text: 'var(--good-text)',
  },
  low: { key: 'low', label: 'Low Stock', bg: 'var(--warn-bg)', text: 'var(--warn-text)' },
  out: { key: 'out', label: 'Out of Stock', bg: 'var(--bad-bg)', text: 'var(--bad-text)' },
};

export type ExpiryStatusKey = 'none' | 'ok' | 'expiring' | 'expired';

export const EXPIRY_STATUS: Record<ExpiryStatusKey, StatusMeta> = {
  none: { key: 'none', label: '—', bg: 'var(--surface-alt)', text: 'var(--text-faint)' },
  ok: { key: 'ok', label: 'OK', bg: 'var(--good-bg)', text: 'var(--good-text)' },
  expiring: {
    key: 'expiring',
    label: 'Expiring Soon',
    bg: 'var(--warn-bg)',
    text: 'var(--warn-text)',
  },
  expired: { key: 'expired', label: 'Expired', bg: 'var(--bad-bg)', text: 'var(--bad-text)' },
};

export const TXN_TYPE: Record<string, StatusMeta> = {
  IN: { key: 'IN', label: 'Stock In', bg: 'var(--good-bg)', text: 'var(--good-text)' },
  OUT: { key: 'OUT', label: 'Stock Out', bg: 'var(--info-bg)', text: 'var(--info-text)' },
  WRITE_OFF: { key: 'WRITE_OFF', label: 'Write-Off', bg: 'var(--bad-bg)', text: 'var(--bad-text)' },
};

export function stockStatusFor(currentStock: number, minimumStock: number): StatusMeta {
  if (currentStock <= 0) return STOCK_STATUS.out;
  if (currentStock <= minimumStock) return STOCK_STATUS.low;
  return STOCK_STATUS.available;
}

// A batch or medicine at zero stock is never "actionable" — never flag it as
// expiring/expired even if its date has technically passed. There's nothing
// to act on. (CLAUDE.md rule 4)
export function batchExpiryDisplayStatus(
  currentStock: number,
  expiryDate: string,
  warningDays: number,
  today: string = todayStr(),
): StatusMeta {
  if (currentStock <= 0) return EXPIRY_STATUS.none;
  const days = daysUntil(expiryDate, today);
  if (days < 0) return EXPIRY_STATUS.expired;
  if (days <= warningDays) return EXPIRY_STATUS.expiring;
  return EXPIRY_STATUS.ok;
}

export function expiryStatusKeyFromDb(key: BatchExpiryStatusKey): 'expired' | 'expiring' | 'ok' {
  if (key === 'EXPIRED') return 'expired';
  if (key === 'EXPIRING') return 'expiring';
  return 'ok';
}

// Worst status among a medicine's own active, in-stock batches.
export function worstExpiryStatus(statuses: ExpiryStatusKey[]): StatusMeta {
  if (statuses.length === 0) return EXPIRY_STATUS.none;
  if (statuses.includes('expired')) return EXPIRY_STATUS.expired;
  if (statuses.includes('expiring')) return EXPIRY_STATUS.expiring;
  return EXPIRY_STATUS.ok;
}
