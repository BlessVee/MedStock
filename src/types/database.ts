// Hand-written to match docs/schema.sql. Once the Supabase CLI is set up,
// regenerate with: supabase gen types typescript --project-id <ref> > src/types/database.ts

export type TransactionType = 'IN' | 'OUT' | 'WRITE_OFF';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
}

export interface Medicine {
  id: string;
  name: string;
  category_id: string | null;
  minimum_stock: number;
  expiry_warning_days: number;
  archived_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface MedicineWithCategory extends Medicine {
  category: { name: string } | null;
}

export interface Batch {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  archived_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Transaction {
  id: string;
  batch_id: string;
  type: TransactionType;
  quantity: number;
  unit_cost_price: number | null;
  total_cost_price: number | null;
  unit_sale_price: number | null;
  total_sale_price: number | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

export interface BatchStock {
  batch_id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  archived_at: string | null;
  current_stock: number;
}

export interface MedicineStock {
  medicine_id: string;
  name: string;
  category_id: string | null;
  minimum_stock: number;
  archived_at: string | null;
  total_stock: number;
}

export type BatchExpiryStatusKey = 'EXPIRED' | 'EXPIRING' | 'OK';

export interface BatchExpiryStatusRow {
  batch_id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  expiry_warning_days: number;
  expiry_status: BatchExpiryStatusKey;
}
