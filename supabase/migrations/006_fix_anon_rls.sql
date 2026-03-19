-- Migration 006: Fix anon RLS gaps
-- Migration 002 locked down barbers/services/shop_settings to auth-only.
-- Public booking pages and the customer status page need anon read/write access.

-- ── BARBERS: anon SELECT (needed by booking wizard) ───────────────────────────
CREATE POLICY IF NOT EXISTS "anon_read_barbers" ON barbers
  FOR SELECT TO anon USING (true);

-- ── SERVICES: anon SELECT (needed by booking wizard + queue join) ─────────────
CREATE POLICY IF NOT EXISTS "anon_read_services" ON services
  FOR SELECT TO anon USING (true);

-- ── SHOP SETTINGS: anon SELECT (needed by booking pages for shop name/hours) ──
CREATE POLICY IF NOT EXISTS "anon_read_shop_settings" ON shop_settings
  FOR SELECT TO anon USING (true);

-- ── QUEUE ENTRIES: anon UPDATE + DELETE (needed by customer status page) ──────
-- Decline flow: UPDATE status back to 'waiting', clear offer fields
-- Accept flow: DELETE the queue entry after appointment is inserted
CREATE POLICY IF NOT EXISTS "anon_update_queue" ON queue_entries
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_delete_queue" ON queue_entries
  FOR DELETE TO anon USING (true);

-- ── CUSTOMERS: anon INSERT (needed when queue join creates/updates a customer) ─
CREATE POLICY IF NOT EXISTS "anon_insert_customers" ON customers
  FOR INSERT TO anon WITH CHECK (true);
