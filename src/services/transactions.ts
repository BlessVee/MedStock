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

export interface StockTxnInput {
  batch_id: string;
  type: Extract<TransactionType, 'IN' | 'OUT'>;
  quantity: number;
  price: number;
  reference: string;
  notes: string;
}

export async function createStockTransaction(input: StockTxnInput): Promise<void> {
  const createdBy = await requireUserId();
  const payload: Partial<Transaction> = {
    batch_id: input.batch_id,
    type: input.type,
    quantity: input.quantity,
    reference: input.reference || null,
    notes: input.notes || null,
    created_by: createdBy,
  };
  if (input.type === 'IN') payload.cost_price = input.price;
  else payload.sale_price = input.price;

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
