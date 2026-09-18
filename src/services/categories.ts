import { supabase } from '../lib/supabaseClient';
import type { Category } from '../types/database';

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function addCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
}

// Blocked by the DB's on-delete-restrict FK too, but we check first for a
// clear, specific message rather than surfacing a raw FK violation.
export async function categoryInUse(categoryId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('medicines')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function removeCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
}
