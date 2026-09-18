import { useState, type FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { addCategory, categoryInUse, removeCategory } from '../services/categories';
import { friendlyError } from '../lib/errors';

export function Categories() {
  const { categories, medicines, refetch } = useData();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState('');

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast('error', 'Enter a category name.');
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return toast('error', 'Category already exists.');
    }
    try {
      await addCategory(trimmed);
      setName('');
      toast('success', 'Category added.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  async function handleRemove(id: string, catName: string) {
    try {
      const inUse = await categoryInUse(id);
      if (inUse) {
        toast('error', 'Category is in use — reassign medicines first.');
        return;
      }
      const ok = await confirm({
        title: 'Remove category?',
        message: `Remove the "${catName}" category? This cannot be undone.`,
        confirmLabel: 'Remove',
        danger: true,
      });
      if (!ok) return;
      await removeCategory(id);
      toast('success', 'Category removed.');
      await refetch();
    } catch (err) {
      toast('error', friendlyError(err));
    }
  }

  return (
    <div>
      <PageHeader title="Categories" subtitle="Manage medicine categories" />

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          className="input"
          style={{ flex: 1, maxWidth: 280 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name…"
        />
        <button type="submit" className="btn btn-primary">
          Add Category
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {categories.map((c) => {
          const count = medicines.filter(
            (m) => m.category_id === c.id && m.archived_at === null,
          ).length;
          return (
            <div
              key={c.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                borderRadius: 100,
                padding: '8px 8px 8px 16px',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
              <span className="mono muted" style={{ fontSize: 11.5 }}>
                {count}
              </span>
              <button
                onClick={() => handleRemove(c.id, c.name)}
                aria-label={`Remove ${c.name}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
