# MedStock

Clinic medicine stock/inventory tracker. React + TypeScript + Vite frontend, Supabase (Postgres + Auth) backend — no separate API layer.

## Setup

1. **Supabase project**: create one at https://supabase.com/dashboard, then open **SQL Editor** and run the entire contents of `docs/schema.sql`.
2. **Staff accounts**: under **Authentication → Users**, add one email/password account per staff member (auto-confirmed). There's no self-signup.
3. **Environment**: copy `.env.example` to `.env` and fill in your project's URL and anon/public key from **Project Settings → API**. Never use the `service_role` key here.
4. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```

## Regenerating types

`src/types/database.ts` is hand-written to match `docs/schema.sql`. Once you have the Supabase CLI set up, regenerate it from the live schema instead:

```bash
supabase gen types typescript --project-id <your-project-ref> > src/types/database.ts
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build for production
- `npm run lint` — ESLint
- `npm run format` — Prettier (write)
- `npm run format:check` — Prettier (check only)

## Structure

- `src/services/` — all Supabase queries/mutations (data layer)
- `src/context/` — Auth, Toast, Confirm, Theme, and the central inventory `DataContext`
- `src/hooks/` — shared business-rule flows (archive/restore/delete-forever)
- `src/components/` — shared UI (modals, cards, badges, sidebar)
- `src/pages/` — one component per screen
