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
DROP POLICY IF EXISTS anon_all_barbers              ON barbers;
DROP POLICY IF EXISTS anon_all_services             ON services;
DROP POLICY IF EXISTS anon_all_shop_settings        ON shop_settings;
DROP POLICY IF EXISTS anon_all_appointments         ON appointments;
DROP POLICY IF EXISTS anon_all_queue                ON queue_entries;
DROP POLICY IF EXISTS anon_all_customers            ON customers;
DROP POLICY IF EXISTS anon_all_visits               ON visits;
DROP POLICY IF EXISTS auth_all_barbers              ON barbers;
DROP POLICY IF EXISTS auth_all_services             ON services;
DROP POLICY IF EXISTS auth_all_shop_settings        ON shop_settings;
DROP POLICY IF EXISTS auth_all_appointments         ON appointments;
DROP POLICY IF EXISTS auth_all_queue                ON queue_entries;
DROP POLICY IF EXISTS auth_all_customers            ON customers;
DROP POLICY IF EXISTS auth_all_visits               ON visits;
DROP POLICY IF EXISTS anon_read_barbers             ON barbers;
DROP POLICY IF EXISTS anon_read_services            ON services;
DROP POLICY IF EXISTS anon_read_shop_settings       ON shop_settings;
DROP POLICY IF EXISTS anon_read_appointments        ON appointments;
DROP POLICY IF EXISTS anon_insert_appointments      ON appointments;
DROP POLICY IF EXISTS anon_insert_queue_appointments ON appointments;
DROP POLICY IF EXISTS anon_insert_queue             ON queue_entries;
DROP POLICY IF EXISTS anon_read_queue               ON queue_entries;
DROP POLICY IF EXISTS anon_select_queue             ON queue_entries;
DROP POLICY IF EXISTS anon_update_queue             ON queue_entries;
DROP POLICY IF EXISTS anon_delete_queue             ON queue_entries;
DROP POLICY IF EXISTS anon_decline_queue_offer      ON queue_entries;
DROP POLICY IF EXISTS anon_accept_delete_queue      ON queue_entries;
DROP POLICY IF EXISTS anon_insert_customers         ON customers;

-- ── Staff-only tables: authenticated full access ────────────────────────────
CREATE POLICY "auth_all_barbers"       ON barbers       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_services"      ON services      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_shop_settings" ON shop_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_customers"     ON customers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_visits"        ON visits        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Anon read-only (booking wizard needs barbers, services, shop hours) ─────
CREATE POLICY "anon_read_barbers"       ON barbers       FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_services"      ON services      FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_shop_settings" ON shop_settings FOR SELECT TO anon USING (true);

-- ── Appointments ────────────────────────────────────────────────────────────
CREATE POLICY "auth_all_appointments"        ON appointments FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_appointments"       ON appointments FOR SELECT TO anon          USING (true);
CREATE POLICY "anon_insert_queue_appointments" ON appointments FOR INSERT TO anon
  WITH CHECK (status = 'scheduled' AND from_queue = true);

-- ── Queue entries ───────────────────────────────────────────────────────────
CREATE POLICY "auth_all_queue"           ON queue_entries FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_queue"        ON queue_entries FOR INSERT TO anon          WITH CHECK (true);
CREATE POLICY "anon_read_queue"          ON queue_entries FOR SELECT TO anon          USING (true);
CREATE POLICY "anon_decline_queue_offer" ON queue_entries FOR UPDATE TO anon
  USING  (status = 'offered')
  WITH CHECK (status = 'waiting');
CREATE POLICY "anon_accept_delete_queue" ON queue_entries FOR DELETE TO anon
  USING (status = 'offered');

-- ─────────────────────────────────────────────
-- 3. SEED — barbers + services
-- (uses INSERT ... ON CONFLICT DO NOTHING so safe to re-run)
-- ─────────────────────────────────────────────

-- Only seed if tables are empty
INSERT INTO services (name, duration_minutes, price)
SELECT * FROM (VALUES
  ('Haircut',         30, 25.00::numeric),
  ('Fade',            45, 35.00::numeric),
  ('Beard Trim',      20, 12.00::numeric),
  ('Haircut + Beard', 60, 45.00::numeric)
) AS v(name, duration_minutes, price)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

INSERT INTO barbers (name, color, work_days, start_time, end_time, lunch_start, lunch_end, service_durations)
SELECT * FROM (VALUES
  ('Marcus', '#3b82f6', ARRAY[1,2,3,4,5], '09:00', '18:00', '12:00', '13:00', '{}'::jsonb),
  ('Devon',  '#10b981', ARRAY[2,3,4,5,6], '09:00', '18:00', '13:00', '13:30', '{}'::jsonb),
  ('Jaylen', '#8b5cf6', ARRAY[1,3,4,5,6], '09:00', '18:00', '12:30', '13:15', '{}'::jsonb)
) AS v(name, color, work_days, start_time, end_time, lunch_start, lunch_end, service_durations)
WHERE NOT EXISTS (SELECT 1 FROM barbers LIMIT 1);

-- ─────────────────────────────────────────────
-- 4. ENABLE REALTIME — required for postgres_changes subscriptions
-- ─────────────────────────────────────────────
-- Supabase Realtime only delivers events for tables in this publication.
-- Without these lines the dashboard Realtime channels silently receive nothing.
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;

-- ─────────────────────────────────────────────
-- 5. CREATE STAFF USER — Aiden's login
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
