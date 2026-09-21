import { supabase } from '../lib/supabaseClient';
import type { Transaction, TransactionType } from '../types/database';

// Small clinic, single shared inventory — capping the ledger fetch keeps this
// simple without a full pagination UI (the design doesn't call for one).
const LEDGER_FETCH_CAP = 3000;

export interface TransactionWithNames extends Transaction {
  batch: { batch_number: string; medicine: { name: string } | null } | null;
}

export async function listRecentTransactions(limit: number): Promise<TransactionWithNames[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, batch:batches(batch_number, medicine:medicines(name))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as TransactionWithNames[];
}

export async function listLedgerTransactions(): Promise<TransactionWithNames[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, batch:batches(batch_number, medicine:medicines(name))')
    .order('created_at', { ascending: false })
    .limit(LEDGER_FETCH_CAP);
  if (error) throw error;
  return data as unknown as TransactionWithNames[];
}

export async function listTransactionsForBatchIds(batchIds: string[]): Promise<Transaction[]> {
  if (batchIds.length === 0) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .in('batch_id', batchIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export type PriceEntryMode = 'unit' | 'total';

export interface StockTxnInput {
  batch_id: string;
  type: Extract<TransactionType, 'IN' | 'OUT'>;
  quantity: number;
  priceMode: PriceEntryMode;
  priceValue: number;
  reference: string;
  notes: string;
}

// Whichever value staff enter (per-unit or total) is stored exactly as
// given; the other is derived from quantity and rounded to cents. Both are
// always persisted so the ledger never has to recompute one from the other
// later on.
export function deriveUnitAndTotal(
  mode: PriceEntryMode,
  value: number,
  quantity: number,
): { unit: number; total: number } {
  if (mode === 'unit') {
    return { unit: value, total: Math.round(value * quantity * 100) / 100 };
  }
  return { unit: Math.round((value / quantity) * 100) / 100, total: value };
}

export async function createStockTransaction(input: StockTxnInput): Promise<void> {
  const createdBy = await requireUserId();
  const { unit, total } = deriveUnitAndTotal(input.priceMode, input.priceValue, input.quantity);
  const payload: Partial<Transaction> = {
    batch_id: input.batch_id,
    type: input.type,
    quantity: input.quantity,
    reference: input.reference || null,
    notes: input.notes || null,
    created_by: createdBy,
  };
  if (input.type === 'IN') {
    payload.unit_cost_price = unit;
    payload.total_cost_price = total;
  } else {
    payload.unit_sale_price = unit;
    payload.total_sale_price = total;
  }

  const { error } = await supabase.from('transactions').insert(payload);
  if (error) throw error;
}

export interface WriteOffInput {
  batch_id: string;
  quantity: number;
  notes: string;
}

export async function createWriteOff(input: WriteOffInput): Promise<void> {
  const createdBy = await requireUserId();
  const { error } = await supabase.from('transactions').insert({
    batch_id: input.batch_id,
    type: 'WRITE_OFF',
    quantity: input.quantity,
    notes: input.notes || null,
    created_by: createdBy,
  });
  if (error) throw error;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}
