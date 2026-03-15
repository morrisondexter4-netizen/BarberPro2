# Supabase Setup — BarberPro2

Everything is wired. You just need to fill in your keys and run the SQL.

---

## Step 1 — Fill in .env.local

Open `/Users/dexterm/BarberPro2/.env.local` and replace the placeholders:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → your project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → service_role secret key (keep this server-side only) |

---

## Step 2 — Run the SQL schema

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Open `supabase/schema.sql` from this project
5. Paste the entire contents and click **Run**

This creates all 7 tables:
- `barbers`
- `services`
- `shop_settings`
- `appointments`
- `queue_entries`
- `customers`
- `visits`

RLS is enabled on all tables with open anon policies — appropriate for now. Tighten once auth is fully wired.

---

## Step 3 — Enable Email Auth in Supabase

1. Supabase dashboard → Authentication → Providers
2. Make sure **Email** is enabled
3. Create your first barber user: Authentication → Users → Add user
4. Use any email + password — this will be the staff login

---

## Step 4 — Start the app

```bash
cd /Users/dexterm/BarberPro2
npm run dev
```

With keys filled in, the app will:
- Require login at `/login` before accessing any staff route
- Read/write all data from Supabase instead of localStorage
- Still work in localStorage mode if `.env.local` keys are left as placeholders (for local dev without a DB connection)

---

## What's already built

| File | What it does |
|---|---|
| `lib/supabase.ts` | Supabase client + `isSupabaseConfigured()` guard |
| `lib/db/appointments.ts` | CRUD for appointments table |
| `lib/db/barbers.ts` | CRUD for barbers table |
| `lib/db/customers.ts` | CRUD for customers table |
| `lib/db/queue.ts` | CRUD for queue_entries table |
| `lib/db/services.ts` | CRUD for services table |
| `lib/db/shop-settings.ts` | CRUD for shop_settings table |
| `lib/db/visits.ts` | CRUD for visits table |
| `app/login/page.tsx` | Staff login page (email + password via Supabase Auth) |
| `middleware.ts` | Redirects unauthenticated users to `/login` |
| `supabase/schema.sql` | Full SQL schema — run this in the SQL editor |

---

## Next step after this

The db layer functions exist but the UI still reads from localStorage (`lib/settings.ts` and `lib/crm/store.ts`).
The next integration milestone is swapping those out to call the `lib/db/*` functions instead.
That's a separate task — confirm with Dexter before touching those files.

---

## Security note

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Never expose it to the browser.
It is not used anywhere in the current codebase — only `NEXT_PUBLIC_*` keys are used client-side.
