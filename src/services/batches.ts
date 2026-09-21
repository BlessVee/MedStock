import { supabase } from '../lib/supabaseClient';
import type { Batch, BatchStock } from '../types/database';

export async function listAllBatches(): Promise<Batch[]> {
  const { data, error } = await supabase.from('batches').select('*');
  if (error) throw error;
  return data;
}

export async function listBatchStock(): Promise<BatchStock[]> {
  const { data, error } = await supabase.from('batch_stock').select('*');
  if (error) throw error;
  return data;
}

export interface BatchFormInput {
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
}

export async function createBatch(input: BatchFormInput): Promise<Batch> {
  const { data, error } = await supabase.from('batches').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function archiveBatch(id: string): Promise<void> {
  const { error } = await supabase
    .from('batches')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Restore rule 2: block if an ACTIVE batch of the same medicine now has the
// same batch number (partial unique index only covers active rows).
export async function activeBatchNumberCollision(
  medicineId: string,
  batchNumber: string,
  excludeId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('batches')
    .select('id')
    .is('archived_at', null)
    .eq('medicine_id', medicineId)
    .eq('batch_number', batchNumber)
    .neq('id', excludeId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function restoreBatch(id: string): Promise<void> {
  const { error } = await supabase.from('batches').update({ archived_at: null }).eq('id', id);
  if (error) throw error;
}

export async function batchHasTransactions(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function hardDeleteBatch(id: string): Promise<void> {
  const { error } = await supabase.rpc('hard_delete_batch', { p_batch_id: id });
  if (error) throw error;
}

export type { Batch };
