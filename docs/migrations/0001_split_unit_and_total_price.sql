-- =====================================================
-- Migration 0001: split single price column into unit + total price
--
-- Context: transactions.cost_price / sale_price used to hold a single
-- number that the UI asked for as "total price for this quantity". The
-- app now lets staff enter either a per-unit price (default) or a total
-- price, and always stores both. Run this once against an already
-- provisioned Supabase project to bring it in line with docs/schema.sql.
--
-- Existing rows are assumed to hold a TOTAL price (that was the only
-- entry mode before this change), so they become total_cost_price /
-- total_sale_price as-is, and unit price is backfilled by dividing by
-- quantity and rounding to cents.
-- =====================================================

alter table public.transactions
  rename column cost_price to total_cost_price;

alter table public.transactions
  rename column sale_price to total_sale_price;

alter table public.transactions
  add column unit_cost_price numeric(10,2) check (unit_cost_price >= 0),
  add column unit_sale_price numeric(10,2) check (unit_sale_price >= 0);

update public.transactions
set unit_cost_price = round(total_cost_price / quantity, 2)
where total_cost_price is not null;

update public.transactions
set unit_sale_price = round(total_sale_price / quantity, 2)
where total_sale_price is not null;

-- No RLS/grant changes needed — the existing transactions policies and
-- grants already cover the table as a whole, not individual columns.
