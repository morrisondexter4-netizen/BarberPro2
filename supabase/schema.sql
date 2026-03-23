-- BarberPro2 Supabase Schema
-- Run this in the Supabase SQL editor after creating your project.
-- Tables match the TypeScript types in lib/types.ts and lib/crm/types.ts.

-- ─────────────────────────────────────────────
-- BARBERS
-- ─────────────────────────────────────────────
create table if not exists barbers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  color         text not null default '#6b7280',
  work_days     int[] not null default '{1,2,3,4,5}', -- 0=Sun … 6=Sat
  start_time    text not null default '09:00',
  end_time      text not null default '18:00',
  lunch_start   text,
  lunch_end     text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────────
create table if not exists services (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  duration_minutes  int  not null default 30,
  price             numeric(10,2) not null default 0,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- SHOP SETTINGS  (single row — upsert by id)
-- ─────────────────────────────────────────────
create table if not exists shop_settings (
  id           uuid primary key default gen_random_uuid(),
  shop_name    text not null default 'Classic Cuts',
  address      text not null default '',
  phone        text not null default '',
  hours        jsonb not null default '{}'::jsonb,  -- Record<string, ShopHours>
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────────
create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  barber_id       uuid references barbers(id) on delete set null,
  customer_name   text not null,
  customer_phone  text not null default '',
  customer_email  text not null default '',
  customer_id     text,          -- optional link to customers table id
  service_id      text not null, -- references services(id) as text for flexibility
  start_time      text not null, -- "HH:MM"
  end_time        text not null, -- "HH:MM"
  date            date not null,
  status          text not null default 'scheduled'
                    check (status in ('scheduled','checked-in','no-show','paid','cancelled')),
  from_queue      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_appointments_barber_id on appointments(barber_id);
create index if not exists idx_appointments_date on appointments(date);

-- ─────────────────────────────────────────────
-- QUEUE ENTRIES
-- ─────────────────────────────────────────────
create table if not exists queue_entries (
  id                      uuid primary key default gen_random_uuid(),
  barber_id               uuid references barbers(id) on delete set null,
  client_name             text not null,
  client_phone            text not null default '',
  client_email            text not null default '',
  customer_id             text,
  service_id              text not null,
  wait_minutes            int not null default 0,
  position                int not null default 1,
  joined_at               timestamptz not null default now(),
  status                  text not null default 'waiting',
  offered_time            text,
  offered_date            text,
  offered_barber_id       uuid references barbers(id) on delete set null
);

create index if not exists idx_queue_barber_id on queue_entries(barber_id);

-- ─────────────────────────────────────────────
-- CRM CUSTOMERS
-- ─────────────────────────────────────────────
create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  first_name   text not null,
  last_name    text not null,
  phone        text not null,
  email        text not null,
  notes        text not null default '',
  visit_count  int not null default 0,
  created_at   timestamptz not null default now(),
  constraint customers_phone_unique unique (phone),
  constraint customers_email_unique unique (email)
);

-- ─────────────────────────────────────────────
-- CRM VISITS
-- ─────────────────────────────────────────────
create table if not exists visits (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references customers(id) on delete cascade,
  date              date not null,
  barber_name       text not null,
  service           text not null, -- "Haircut" | "Fade" | "Beard Trim" | "Haircut + Beard"
  duration_minutes  int not null default 45,
  source            text not null default 'WALK_IN'
                      check (source in ('WALK_IN','BOOKED')),
  outcome           text not null default 'DONE'
                      check (outcome in ('DONE','NO_SHOW')),
  price             numeric(10,2),
  tip               numeric(10,2),
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_visits_customer_id on visits(customer_id);
create index if not exists idx_visits_date on visits(date);

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- Enable RLS on every table. Allow full access for the anon role so the
-- app works without auth. Add proper per-user policies once auth is wired up.
-- ─────────────────────────────────────────────
alter table barbers         enable row level security;
alter table services        enable row level security;
alter table shop_settings   enable row level security;
alter table appointments    enable row level security;
alter table queue_entries   enable row level security;
alter table customers       enable row level security;
alter table visits          enable row level security;

-- Allow all operations for anon (open access — tighten after auth is added)
create policy "anon_all_barbers"       on barbers       for all to anon using (true) with check (true);
create policy "anon_all_services"      on services      for all to anon using (true) with check (true);
create policy "anon_all_shop_settings" on shop_settings for all to anon using (true) with check (true);
create policy "anon_all_appointments"  on appointments  for all to anon using (true) with check (true);
create policy "anon_all_queue"         on queue_entries for all to anon using (true) with check (true);
create policy "anon_all_customers"     on customers     for all to anon using (true) with check (true);
create policy "anon_all_visits"        on visits        for all to anon using (true) with check (true);
