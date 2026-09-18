import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Category, MedicineWithCategory, Batch } from '../types/database';
import { listCategories } from '../services/categories';
import { listAllMedicines, listMedicineStock } from '../services/medicines';
import { listAllBatches, listBatchStock } from '../services/batches';
import {
  stockStatusFor,
  batchExpiryDisplayStatus,
  worstExpiryStatus,
  type ExpiryStatusKey,
  type StatusMeta,
} from '../domain/status';
import { todayStr } from '../utils/date';
import { friendlyError } from '../lib/errors';
import { useToast } from './ToastContext';

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  medicines: MedicineWithCategory[];
  batches: Batch[];
  activeMedicines: MedicineWithCategory[];
  archivedMedicines: MedicineWithCategory[];
  activeBatches: Batch[];
  archivedBatches: Batch[];
  refetch: () => Promise<void>;

  medicineById: (id: string) => MedicineWithCategory | undefined;
  batchById: (id: string) => Batch | undefined;
  batchesForMedicine: (medicineId: string, activeOnly?: boolean) => Batch[];
  medicineStock: (medicineId: string) => number;
  batchStock: (batchId: string) => number;
  medicineStockStatus: (medicine: MedicineWithCategory) => StatusMeta;
  batchExpiryStatus: (batch: Batch, warningDays: number) => StatusMeta;
  medicineExpiryStatus: (medicine: MedicineWithCategory) => StatusMeta;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [medicines, setMedicines] = useState<MedicineWithCategory[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicineStockMap, setMedicineStockMap] = useState<Map<string, number>>(new Map());
  const [batchStockMap, setBatchStockMap] = useState<Map<string, number>>(new Map());

  const refetch = useCallback(async () => {
    try {
      const [cats, meds, bats, medStock, batStock] = await Promise.all([
        listCategories(),
        listAllMedicines(),
        listAllBatches(),
        listMedicineStock(),
        listBatchStock(),
      ]);
      setCategories(cats);
      setMedicines(meds);
      setBatches(bats);
      setMedicineStockMap(new Map(medStock.map((r) => [r.medicine_id, r.total_stock])));
      setBatchStockMap(new Map(batStock.map((r) => [r.batch_id, r.current_stock])));
    } catch (err) {
      toast('error', friendlyError(err, 'Could not load inventory data.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const medicineById = useCallback((id: string) => medicines.find((m) => m.id === id), [medicines]);
  const batchById = useCallback((id: string) => batches.find((b) => b.id === id), [batches]);
  const batchStock = useCallback((id: string) => batchStockMap.get(id) ?? 0, [batchStockMap]);
  const medicineStock = useCallback(
    (id: string) => medicineStockMap.get(id) ?? 0,
    [medicineStockMap],
  );

  const batchesForMedicine = useCallback(
    (medicineId: string, activeOnly = true) =>
      batches.filter(
        (b) => b.medicine_id === medicineId && (!activeOnly || b.archived_at === null),
      ),
    [batches],
  );

  const medicineStockStatus = useCallback(
    (medicine: MedicineWithCategory) =>
      stockStatusFor(medicineStock(medicine.id), medicine.minimum_stock),
    [medicineStock],
  );

  const batchExpiryStatus = useCallback(
    (batch: Batch, warningDays: number) =>
      batchExpiryDisplayStatus(batchStock(batch.id), batch.expiry_date, warningDays, todayStr()),
    [batchStock],
  );

  const medicineExpiryStatus = useCallback(
    (medicine: MedicineWithCategory) => {
      const active = batchesForMedicine(medicine.id, true);
      const statuses = active
        .map((b) => batchExpiryStatus(b, medicine.expiry_warning_days).key as ExpiryStatusKey)
        .filter((k) => k !== 'none');
      return worstExpiryStatus(statuses);
    },
    [batchesForMedicine, batchExpiryStatus],
  );

  const activeMedicines = useMemo(
    () => medicines.filter((m) => m.archived_at === null),
    [medicines],
  );
  const archivedMedicines = useMemo(
    () => medicines.filter((m) => m.archived_at !== null),
    [medicines],
  );
  const activeBatches = useMemo(() => batches.filter((b) => b.archived_at === null), [batches]);
  const archivedBatches = useMemo(() => batches.filter((b) => b.archived_at !== null), [batches]);

  const value: DataContextValue = {
    loading,
    categories,
    medicines,
    batches,
    activeMedicines,
    archivedMedicines,
    activeBatches,
    archivedBatches,
    refetch,
    medicineById,
    batchById,
    batchesForMedicine,
    medicineStock,
    batchStock,
    medicineStockStatus,
    batchExpiryStatus,
    medicineExpiryStatus,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
