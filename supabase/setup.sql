-- BarberPro2 — One-shot setup SQL
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (all operations are idempotent)

-- ─────────────────────────────────────────────
-- 1. MIGRATION — add service_durations column
-- ─────────────────────────────────────────────
ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS service_durations JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────
-- 2. RLS — replace open anon policies with proper auth policies
-- ─────────────────────────────────────────────

-- Drop ALL policies (old and new names) so this is safe to re-run
DROP POLICY IF EXISTS anon_all_barbers        ON barbers;
DROP POLICY IF EXISTS anon_all_services       ON services;
DROP POLICY IF EXISTS anon_all_shop_settings  ON shop_settings;
DROP POLICY IF EXISTS anon_all_appointments   ON appointments;
DROP POLICY IF EXISTS anon_all_queue          ON queue_entries;
DROP POLICY IF EXISTS anon_all_customers      ON customers;
DROP POLICY IF EXISTS anon_all_visits         ON visits;
DROP POLICY IF EXISTS auth_all_barbers        ON barbers;
DROP POLICY IF EXISTS auth_all_services       ON services;
DROP POLICY IF EXISTS auth_all_shop_settings  ON shop_settings;
DROP POLICY IF EXISTS auth_all_appointments   ON appointments;
DROP POLICY IF EXISTS auth_all_queue          ON queue_entries;
DROP POLICY IF EXISTS auth_all_customers      ON customers;
DROP POLICY IF EXISTS auth_all_visits         ON visits;
DROP POLICY IF EXISTS anon_read_appointments  ON appointments;
DROP POLICY IF EXISTS anon_insert_queue       ON queue_entries;
DROP POLICY IF EXISTS anon_read_queue         ON queue_entries;

-- Staff-only tables: authenticated users only
CREATE POLICY "auth_all_barbers"       ON barbers       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_services"      ON services      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_shop_settings" ON shop_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_customers"     ON customers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_visits"        ON visits        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Appointments: authenticated full access + anon read (for booking availability)
CREATE POLICY "auth_all_appointments"  ON appointments FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_appointments" ON appointments FOR SELECT TO anon          USING (true);

-- Queue: authenticated full access + anon can join (insert) and view (select)
CREATE POLICY "auth_all_queue"    ON queue_entries FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_queue" ON queue_entries FOR INSERT TO anon          WITH CHECK (true);
CREATE POLICY "anon_read_queue"   ON queue_entries FOR SELECT TO anon          USING (true);

-- ─────────────────────────────────────────────
-- 3. SEED — barbers + services
-- (uses INSERT ... ON CONFLICT DO NOTHING so safe to re-run)
-- ─────────────────────────────────────────────

INSERT INTO services (id, name, duration_minutes, price) VALUES
  ('s1', 'Haircut',        30, 25.00),
  ('s2', 'Fade',           45, 35.00),
  ('s3', 'Beard Trim',     20, 12.00),
  ('s4', 'Haircut + Beard',60, 45.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO barbers (id, name, color, work_days, start_time, end_time, lunch_start, lunch_end, service_durations) VALUES
  ('b1', 'Marcus', '#3b82f6', '{1,2,3,4,5}', '09:00', '18:00', '12:00', '13:00', '{}'),
  ('b2', 'Devon',  '#10b981', '{2,3,4,5,6}', '09:00', '18:00', '13:00', '13:30', '{}'),
  ('b3', 'Jaylen', '#8b5cf6', '{1,3,4,5,6}', '09:00', '18:00', '12:30', '13:15', '{}')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. CREATE STAFF USER — Aiden's login
-- Run this AFTER the above, in a separate SQL Editor tab:
--
--   select auth.create_user(
--     email    := 'aiden@leonesbarbershop.com',
--     password := 'ChangeMe123!',
--     email_confirm := true
--   );
--
-- Or use Supabase Dashboard → Authentication → Users → Add user
-- ─────────────────────────────────────────────
