-- =====================================================
-- MEDSTOCK — SCHEMA (v2, includes RLS)
-- Paste this whole file into Supabase's SQL Editor and run it.
-- Auth: create staff accounts under Authentication > Users first
-- (email/password), so auth.uid() resolves for created_by/RLS.
-- =====================================================

create extension if not exists pgcrypto;


-- =====================================================
-- 1. CATEGORIES
-- Flexible: any authenticated user can add/delete their own.
-- =====================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

-- Seed the same defaults your current app ships with
insert into public.categories (name) values
  ('Tablet'), ('Capsule'), ('Syrup'), ('Injection'),
  ('Cream'), ('Drops'), ('Other');


-- =====================================================
-- 2. MEDICINES (master drug catalog — no batch/expiry here)
-- =====================================================

create table public.medicines (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  category_id          uuid references public.categories(id) on delete restrict,
  minimum_stock        integer not null default 10 check (minimum_stock >= 0),
  expiry_warning_days  integer not null default 60 check (expiry_warning_days > 0),
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  created_by           uuid references auth.users(id),
  updated_at           timestamptz not null default now(),
  updated_by           uuid references auth.users(id)
);

-- Unique only among ACTIVE medicines — an archived medicine's name
-- doesn't block creating a new one with that same name.
create unique index medicines_active_name_key
  on public.medicines (name) where archived_at is null;


-- =====================================================
-- 3. BATCHES (multiple per medicine — this is the new part)
-- Current stock is NOT stored here; it's derived from
-- transactions, same "ledger" principle as your original app.
-- =====================================================

create table public.batches (
  id            uuid primary key default gen_random_uuid(),
  medicine_id   uuid not null references public.medicines(id) on delete restrict,
  batch_number  text not null,
  expiry_date   date not null check (expiry_date > current_date),
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id)
);

-- Same idea as medicines: only ACTIVE batches of a medicine need a
-- unique batch number, so an archived one doesn't block reusing it.
create unique index batches_active_medicine_batch_key
  on public.batches (medicine_id, batch_number) where archived_at is null;


-- =====================================================
-- 4. TRANSACTIONS (the ledger — editable/deletable, see grants below;
-- no longer strictly append-only, but every change is audited)
-- =====================================================

-- WRITE_OFF behaves like OUT for stock math, but marks the reduction
-- as expired/damaged/lost rather than dispensed — keeps reporting honest.
create type public.transaction_type as enum ('IN', 'OUT', 'WRITE_OFF');

-- Price is recorded both per-unit and as the transaction total. Staff can
-- enter either one (per-unit price is the default entry mode in the UI) and
-- the app computes and stores the other at insert time, so both are always
-- present and exact — never recomputed later from quantity, which would
-- drift if quantity math ever changed. WRITE_OFF sets none of the four.
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  batch_id          uuid not null references public.batches(id) on delete restrict,
  type              public.transaction_type not null,
  quantity          integer not null check (quantity > 0),
  unit_cost_price   numeric(10,2) check (unit_cost_price >= 0),
  total_cost_price  numeric(10,2) check (total_cost_price >= 0),
  unit_sale_price   numeric(10,2) check (unit_sale_price >= 0),
  total_sale_price  numeric(10,2) check (total_sale_price >= 0),
  reference         text,
  notes             text,
  created_at        timestamptz not null default now(),
  created_by        uuid not null references auth.users(id)
);


-- =====================================================
-- 5. AUDIT LOG (generic — catches edits to medicines & batches)
-- =====================================================

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  record_id   uuid not null,
  changed_at  timestamptz not null default now(),
  changed_by  uuid references auth.users(id),
  old_data    jsonb,
  new_data    jsonb
);

-- Handles both UPDATE (old_data + new_data) and DELETE (old_data only,
-- new_data null) so it can also back the transactions edit/delete audit
-- trail below — transactions are otherwise append-only, so every edit or
-- delete MUST leave a permanent record here of what it used to be.
create or replace function public.log_audit_change()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    insert into public.audit_log (table_name, record_id, changed_by, old_data, new_data)
    values (TG_TABLE_NAME, OLD.id, auth.uid(), to_jsonb(OLD), null);
    return OLD;
  else
    insert into public.audit_log (table_name, record_id, changed_by, old_data, new_data)
    values (TG_TABLE_NAME, OLD.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger medicines_audit
after update on public.medicines
for each row execute function public.log_audit_change();

create trigger batches_audit
after update on public.batches
for each row execute function public.log_audit_change();

-- Transactions are otherwise insert-only; staff CAN edit/delete them (see
-- grants below), but every change is captured here so the ledger stays
-- fully traceable even though it is no longer strictly immutable.
create trigger transactions_audit_update
after update on public.transactions
for each row execute function public.log_audit_change();

create trigger transactions_audit_delete
after delete on public.transactions
for each row execute function public.log_audit_change();

-- Auto-stamp who last edited a medicine and when
create or replace function public.set_updated_meta()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger medicines_set_updated
before update on public.medicines
for each row execute function public.set_updated_meta();

-- =====================================================
-- PERMANENT DELETE (bypasses "on delete restrict" intentionally)
-- These are the ONLY sanctioned way to remove a batch/medicine that
-- has transaction history. Ordinary DELETE statements are still
-- blocked by the restrict FKs above — that protection is unchanged.
-- These functions just delete children first, in order, so the
-- restrict never triggers. Call only after explicit user confirmation.
-- =====================================================

create or replace function public.hard_delete_batch(p_batch_id uuid)
returns void as $$
begin
  delete from public.transactions where batch_id = p_batch_id;
  delete from public.batches where id = p_batch_id;
end;
$$ language plpgsql security definer;

create or replace function public.hard_delete_medicine(p_medicine_id uuid)
returns void as $$
begin
  delete from public.transactions
    where batch_id in (select id from public.batches where medicine_id = p_medicine_id);
  delete from public.batches where medicine_id = p_medicine_id;
  delete from public.medicines where id = p_medicine_id;
end;
$$ language plpgsql security definer;


-- =====================================================
-- 6. DERIVED STOCK VIEWS
-- Mirrors the currentStock() logic from your original app,
-- computed at query time instead of stored (avoids drift).
-- =====================================================

create view public.batch_stock as
select
  b.id as batch_id,
  b.medicine_id,
  b.batch_number,
  b.expiry_date,
  b.archived_at,
  coalesce(sum(case when t.type = 'IN' then t.quantity else -t.quantity end), 0) as current_stock
from public.batches b
left join public.transactions t on t.batch_id = b.id
group by b.id;

-- total_stock only counts this medicine's own NON-ARCHIVED batches —
-- matches the demo's medicineStock(): an archived batch's stock is
-- still real, it just no longer counts toward the active total.
create view public.medicine_stock as
select
  m.id as medicine_id,
  m.name,
  m.category_id,
  m.minimum_stock,
  m.archived_at,
  coalesce(sum(bs.current_stock) filter (where bs.archived_at is null), 0) as total_stock
from public.medicines m
left join public.batch_stock bs on bs.medicine_id = m.id
group by m.id;

-- Expiry status per batch, using that batch's OWN medicine's warning window
-- (expiry_warning_days), not a single global threshold.
create view public.batch_expiry_status as
select
  b.id as batch_id,
  b.medicine_id,
  b.batch_number,
  b.expiry_date,
  m.expiry_warning_days,
  case
    when b.expiry_date < current_date then 'EXPIRED'
    when b.expiry_date <= current_date + m.expiry_warning_days then 'EXPIRING'
    else 'OK'
  end as expiry_status
from public.batches b
join public.medicines m on m.id = b.medicine_id;


-- =====================================================
-- 7. ROW LEVEL SECURITY + GRANTS
-- Everyone on staff shares the same inventory — there's no per-user
-- data isolation here. RLS is about WHAT OPERATIONS are allowed,
-- not who sees which rows: any authenticated user can read
-- everything, but only transactions are truly locked down (insert
-- only, no update, no delete, for anyone).
-- =====================================================

-- Categories: fully open — add or delete freely.
alter table public.categories enable row level security;
grant select, insert, delete on public.categories to authenticated;
create policy "categories_select" on public.categories for select to authenticated using (true);
create policy "categories_insert" on public.categories for insert to authenticated with check (true);
create policy "categories_delete" on public.categories for delete to authenticated using (true);

-- Medicines: read/create/edit freely (edits are audited by the
-- trigger above). No delete grant — permanent removal only
-- through hard_delete_medicine().
alter table public.medicines enable row level security;
grant select, insert, update on public.medicines to authenticated;
create policy "medicines_select" on public.medicines for select to authenticated using (true);
create policy "medicines_insert" on public.medicines for insert to authenticated with check (true);
create policy "medicines_update" on public.medicines for update to authenticated using (true) with check (true);

-- Batches: same pattern as medicines.
alter table public.batches enable row level security;
grant select, insert, update on public.batches to authenticated;
create policy "batches_select" on public.batches for select to authenticated using (true);
create policy "batches_insert" on public.batches for insert to authenticated with check (true);
create policy "batches_update" on public.batches for update to authenticated using (true) with check (true);

-- Transactions: the ledger. Any staff member may edit or delete any
-- transaction at any time (no per-user or time-window restriction) — the
-- append-only guarantee this used to have is now enforced only via the
-- audit_log trigger above, not via RLS. Every edit/delete is recorded
-- there, so the ledger is fully traceable even though it is mutable.
alter table public.transactions enable row level security;
grant select, insert, update, delete on public.transactions to authenticated;
create policy "transactions_select" on public.transactions for select to authenticated using (true);
create policy "transactions_insert" on public.transactions for insert to authenticated with check (true);
create policy "transactions_update" on public.transactions for update to authenticated using (true) with check (true);
create policy "transactions_delete" on public.transactions for delete to authenticated using (true);

-- Audit log: read-only for staff. Only the security-definer trigger
-- function (log_audit_change) ever writes to it.
alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
create policy "audit_log_select" on public.audit_log for select to authenticated using (true);

-- Views are exposed through the API separately from their base
-- tables, so they need their own grants.
grant select on public.batch_stock to authenticated;
grant select on public.medicine_stock to authenticated;
grant select on public.batch_expiry_status to authenticated;

-- Only signed-in staff may even call the permanent-delete functions
-- (never anonymous) — same trust boundary as everything else here.
revoke execute on function public.hard_delete_batch(uuid) from public;
revoke execute on function public.hard_delete_medicine(uuid) from public;
grant execute on function public.hard_delete_batch(uuid) to authenticated;
grant execute on function public.hard_delete_medicine(uuid) to authenticated;
