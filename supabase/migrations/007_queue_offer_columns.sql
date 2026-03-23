-- Idempotent: add queue offer columns if they don't exist yet.
-- Covers cases where 005_queue_offer.sql was skipped or schema.sql was
-- run without migrations.

ALTER TABLE queue_entries
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS offered_time      TEXT,
  ADD COLUMN IF NOT EXISTS offered_date      TEXT,
  ADD COLUMN IF NOT EXISTS offered_barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;
