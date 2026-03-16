-- Migration 002: Tighten RLS policies
-- Replaces open anon_all_* policies with proper authenticated/anon split

-- ── BARBERS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_barbers" ON barbers;
CREATE POLICY "auth_all_barbers" ON barbers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── SERVICES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_services" ON services;
CREATE POLICY "auth_all_services" ON services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── SHOP SETTINGS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_shop_settings" ON shop_settings;
CREATE POLICY "auth_all_shop_settings" ON shop_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── APPOINTMENTS ─────────────────────────────────────────────────────────────
-- authenticated: full access; anon: read only (for booking availability checks)
DROP POLICY IF EXISTS "anon_all_appointments" ON appointments;
CREATE POLICY "auth_all_appointments" ON appointments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_appointments" ON appointments
  FOR SELECT TO anon USING (true);

-- ── QUEUE ENTRIES ─────────────────────────────────────────────────────────────
-- authenticated: full access; anon: insert (join queue) + select (queue status)
DROP POLICY IF EXISTS "anon_all_queue" ON queue_entries;
CREATE POLICY "auth_all_queue" ON queue_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_queue" ON queue_entries
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_queue" ON queue_entries
  FOR SELECT TO anon USING (true);

-- ── CUSTOMERS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_customers" ON customers;
CREATE POLICY "auth_all_customers" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── VISITS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_visits" ON visits;
CREATE POLICY "auth_all_visits" ON visits
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
