-- Add offer fields to queue_entries for customer confirmation flow
ALTER TABLE queue_entries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS offered_time TEXT,
  ADD COLUMN IF NOT EXISTS offered_date TEXT,
  ADD COLUMN IF NOT EXISTS offered_barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;

-- Allow anonymous customers to insert appointments (needed for Accept flow on status page)
CREATE POLICY "anon_insert_appointments" ON appointments
  FOR INSERT TO anon WITH CHECK (true);
