# MedStock — Project Context

MedStock is a clinic medicine stock/inventory tracker for a small
team (under 10 staff, one clinic, one shared inventory — no
multi-tenant or per-user data isolation). Backend is Supabase
(Postgres + Auth). The schema and business rules below have already
been designed and validated in a working localStorage-based
prototype; your job is to implement the real, Supabase-backed app
against the attached `schema.sql` and the visual design that will be
provided separately (from Claude Design).

Read `schema.sql` first — it's the source of truth for tables,
constraints, views, functions, and RLS. Everything below explains
the *behavior* the schema is designed to support, which isn't all
visible from the DDL alone.

## Core data model
- **Categories** → freely creatable/deletable by any staff member
  (seeded with Tablet, Capsule, Syrup, Injection, Cream, Drops,
  Other). Deleting a category in use by any medicine is blocked.
- **Medicines** → the drug catalog. Holds `minimum_stock` (low-stock
  threshold) and `expiry_warning_days` (per-medicine, default 60 —
  NOT a global constant; different drugs warrant different lead
  times before expiry).
- **Batches** → many per medicine. Each batch has its own
  `batch_number` and `expiry_date`. `expiry_date` must be strictly
  in the future at creation time (DB-enforced check constraint, and
  should also be enforced client-side with the date input's `min`).
- **Transactions** → the ledger. `type` is `IN`, `OUT`, or
  `WRITE_OFF`. **Stock is never stored — it is always derived by
  summing transactions** (see `batch_stock`/`medicine_stock` views).
  Never add a stored/editable stock column anywhere.
  - `cost_price` is set on `IN` transactions, `sale_price` on `OUT`.
    Both are nullable; `WRITE_OFF` sets neither. They're intentionally
    separate — cost varies per delivery even for the same batch.
  - `WRITE_OFF` reduces stock exactly like `OUT` but represents
    expired/damaged/lost stock, not dispensed stock. Keep it visually
    and semantically distinct in the UI (don't let it look like a
    normal Stock Out) so future reporting isn't corrupted.

## Business rules that aren't obvious from the schema
1. **Archive vs. permanent delete.** A medicine with any batches, or
   a batch with any transactions, cannot be deleted directly — the
   FK `on delete restrict` blocks it. When the user tries, present a
   choice: **Archive** (sets `archived_at`, hides it from active
   views, fully restorable, nothing destroyed) or **Delete Forever**
   (calls `hard_delete_batch()` / `hard_delete_medicine()`, which
   explicitly delete children before parents — this is the *only*
   sanctioned way around the restrict, and it needs its own separate
   "this cannot be undone" confirmation, distinct from the
   archive/delete-forever choice itself). A record with zero history
   deletes directly with a plain confirm — no need for the choice.
2. **Archived means excluded from every active view and aggregate**
   (dashboard totals, low-stock/expiring alerts, medicine/batch
   pickers in the stock-in/out form) but the data itself is never
   altered. A dedicated Archive view lists archived items with
   Restore and Delete Forever actions.
3. **Restoring has two checks, both required:**
   - If the batch expired *while archived*, warn before restoring
     ("expired on X while archived — restore anyway?") rather than
     silently reintroducing expired stock as if nothing happened.
   - Check for a name/batch-number collision against anything
     created *while the original was archived* (the partial unique
     indexes only enforce uniqueness among active rows, so this is a
     real case) and block the restore with a clear message if found.
4. **A batch or medicine at zero stock is never "actionable"** —
   don't flag it in low-stock or expiring/expired alerts even if its
   expiry date has technically passed or its stock is below minimum.
   There's nothing to act on. This applies to both `EXPIRING` and
   `EXPIRED` batch statuses.
5. **Expiry status is per-batch, computed against that batch's own
   medicine's `expiry_warning_days`** — never a single hardcoded
   global threshold. See `batch_expiry_status` view for the exact
   logic to replicate in queries.
6. Editing a medicine should make it unmistakable that edit mode is
   active (banner/label change, not just a silently-filled form) —
   this was a real point of user confusion in the prototype.

## Auth & RLS (already written in schema.sql)
Any authenticated staff member can read everything and
insert/update medicines, batches, and categories (RLS is about
which *operations* are allowed, not who sees which rows — the whole
clinic shares one inventory). Transactions are insert-only for
everyone — no update or delete grant exists at all, which is what
makes the ledger genuinely append-only rather than append-only by UI
convention. Permanent deletes only happen through the two
`security definer` functions. Create staff accounts manually under
Authentication in the Supabase dashboard (email/password) — there's
no self-signup flow.

## UX patterns already validated — replicate the behavior, restyle the look
- **Toast notifications for every success/error/info outcome.**
  Avoid native `alert`/`confirm`/`prompt` — they can be silently
  blocked in embedded contexts and give zero feedback when they are,
  which caused real confusion in the prototype (Delete looked like
  it "did nothing"). Use in-app toasts and a custom confirm modal
  instead, even in a full standalone app.
- **Dashboard cards that open filtered full-page views**, each with
  its own independent search/filter controls: Total Medicines, Total
  Batches, Low/Out of Stock, Expiring/Expired, and a global Archive
  view.
- **Per-medicine history view** with quick date-range chips (7 days,
  10 days, 30 days, 1 year, custom range) plus CSV export that
  respects whichever filter is currently active.
- **Stock In / Stock Out** is reachable both from a medicine's row
  directly (pre-selecting that medicine) and from its history page —
  don't make it a buried, hard-to-find action.
- CSV export exists in several places (transaction history, low
  stock, expiring/expired, archive, all-medicines, all-batches) and
  should always reflect whatever filter is currently applied, never
  the unfiltered full set.

## Code quality & security expectations
Apply standard, secure coding practices throughout — for the design
implementation and the business logic alike, not just wherever it's
convenient.

**Security**
- Only the Supabase anon/public key belongs in frontend code, read
  from an environment variable (`.env`, excluded from version
  control) — never hardcoded, and never the `service_role` key,
  which bypasses RLS entirely and must never ship to a browser.
- Treat RLS as the real enforcement boundary, not the UI. Client-side
  checks (e.g. "batch has stock > 0" before allowing Write Off) are
  for responsiveness only — assume a user could call the API
  directly and skip the UI entirely, and confirm the schema's
  constraints/RLS hold regardless of what the client sends.
- Use the Supabase client's query builder / RPC calls as designed
  rather than constructing raw SQL from user input.
- Validate user input client-side before it reaches Supabase (empty
  strings, non-positive quantities, malformed dates) even though the
  DB has its own check constraints — fail early with a clear message
  rather than relying on a DB error to surface.
- Don't leak internal error detail (raw Postgres error text, stack
  traces) into the UI — map to a friendly message and log the detail
  separately.

**Standard practices**
- TypeScript, not plain JS. Generate types straight from the schema
  (`supabase gen types typescript`) so the shape of medicines,
  batches, and transactions — nullable `cost_price` vs `sale_price`,
  `archived_at`, etc. — is enforced by the compiler, not just
  convention. A lot of the business logic above depends on getting
  these shapes exactly right.
- Separate the data layer (Supabase queries/mutations) from UI
  components — don't scatter `supabase.from(...)` calls directly
  inside JSX. Wrap them in a services/hooks layer so the
  archive-vs-delete-forever branching and similar rules live in one
  place, not duplicated per screen.
- Consistent component structure and naming conventions across
  screens — no one-off patterns per page.
- Basic accessibility: proper label/input association, keyboard-
  navigable modals, sensible focus management on the confirm/toast
  components — carry over the intent already validated in the
  prototype, in React idioms rather than copying its markup.
- Lint/format enforced (ESLint + Prettier) rather than left to
  individual style.
- Error boundaries around data-fetching sections so one failed query
  doesn't blank the whole screen.

## What's already done vs. what you're building
- Schema, RLS, derived views, and business logic above: **designed
  and agreed** — implement against them as-is rather than
  re-deriving from scratch. If something in the design conflicts
  with a rule above, flag it rather than silently picking one.
- Visual design: coming from Claude Design separately — apply it on
  top of this data/behavior model rather than the reverse.
- **Frontend: React**, using the Supabase JS client
  (`@supabase/supabase-js`) directly for all data access — auth,
  queries against the tables and views, and calls to
  `hard_delete_batch()` / `hard_delete_medicine()`. No separate
  backend/API layer; Supabase is the backend.
