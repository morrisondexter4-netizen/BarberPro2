-- Migration 007: Restrict anon RLS policies
--
-- Closes three security holes introduced by migration 006:
--   1. queue_entries: anon UPDATE/DELETE were wide-open (USING true)
--   2. appointments:  anon INSERT had no constraints
--   3. customers:     anon INSERT allowed arbitrary customer creation
--
-- After this migration anon can only:
--   queue_entries  UPDATE  offered → waiting  (decline flow)
--   queue_entries  DELETE  when status = 'offered'  (accept flow)
--   appointments   INSERT  status = 'scheduled' AND from_queue = true  (accept flow)
--   customers      (no write access)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. QUEUE ENTRIES — replace permissive UPDATE / DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_update_queue" ON queue_entries;
DROP POLICY IF EXISTS "anon_delete_queue" ON queue_entries;

-- Decline: customer can reset an offered entry back to waiting
CREATE POLICY "anon_decline_queue_offer" ON queue_entries
  FOR UPDATE TO anon
  USING  (status = 'offered')
  WITH CHECK (status = 'waiting');

-- Accept: customer can remove their entry once the offer is accepted
CREATE POLICY "anon_accept_delete_queue" ON queue_entries
  FOR DELETE TO anon
  USING (status = 'offered');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. APPOINTMENTS — restrict anon INSERT to queue-originated bookings only
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;

CREATE POLICY "anon_insert_queue_appointments" ON appointments
  FOR INSERT TO anon
  WITH CHECK (status = 'scheduled' AND from_queue = true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CUSTOMERS — remove anon write access entirely
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;

COMMIT;
