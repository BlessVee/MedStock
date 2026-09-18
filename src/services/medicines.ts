import { supabase } from '../lib/supabaseClient';
import type { Medicine, MedicineWithCategory, MedicineStock } from '../types/database';

export async function listAllMedicines(): Promise<MedicineWithCategory[]> {
  const { data, error } = await supabase
    .from('medicines')
    .select('*, category:categories(name)')
    .order('name');
  if (error) throw error;
  return data as unknown as MedicineWithCategory[];
}

export async function listMedicineStock(): Promise<MedicineStock[]> {
  const { data, error } = await supabase.from('medicine_stock').select('*');
  if (error) throw error;
  return data;
}

export interface MedicineFormInput {
  name: string;
  category_id: string;
  minimum_stock: number;
  expiry_warning_days: number;
}

export async function createMedicine(input: MedicineFormInput): Promise<void> {
  const { error } = await supabase.from('medicines').insert(input);
  if (error) throw error;
}

export async function updateMedicine(id: string, input: MedicineFormInput): Promise<void> {
  const { error } = await supabase.from('medicines').update(input).eq('id', id);
  if (error) throw error;
}

export async function archiveMedicine(id: string): Promise<void> {
  const { error } = await supabase
    .from('medicines')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Restore rule 1: block if an ACTIVE medicine now has the same name (only
// possible because the unique index only covers active rows).
export async function activeNameCollision(name: string, excludeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('medicines')
    .select('id')
    .is('archived_at', null)
    .eq('name', name)
    .neq('id', excludeId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function restoreMedicine(id: string): Promise<void> {
  const { error } = await supabase.from('medicines').update({ archived_at: null }).eq('id', id);
  if (error) throw error;
}

export async function medicineHasBatches(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('batches')
    .select('id', { count: 'exact', head: true })
    .eq('medicine_id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function deleteMedicineDirect(id: string): Promise<void> {
  const { error } = await supabase.from('medicines').delete().eq('id', id);
  if (error) throw error;
}

export async function hardDeleteMedicine(id: string): Promise<void> {
  const { error } = await supabase.rpc('hard_delete_medicine', { p_medicine_id: id });
  if (error) throw error;
}

export type { Medicine };
