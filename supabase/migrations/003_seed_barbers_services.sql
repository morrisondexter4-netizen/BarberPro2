-- Migration 003: Seed barbers and services from mock-data.ts
-- Run AFTER migration 001 (service_durations column must exist)
-- Uses INSERT ... ON CONFLICT DO NOTHING so it's safe to re-run

-- ── SERVICES ─────────────────────────────────────────────────────────────────
INSERT INTO services (id, name, duration_minutes, price) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Haircut',        30, 25.00),
  ('00000000-0000-0000-0000-000000000002', 'Fade',           45, 35.00),
  ('00000000-0000-0000-0000-000000000003', 'Beard Trim',     20, 12.00),
  ('00000000-0000-0000-0000-000000000004', 'Haircut + Beard',60, 45.00)
ON CONFLICT (id) DO NOTHING;

-- ── BARBERS ──────────────────────────────────────────────────────────────────
INSERT INTO barbers (id, name, color, work_days, start_time, end_time, lunch_start, lunch_end, service_durations) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    'Marcus',
    'blue',
    '{1,2,3,4,5}',
    '09:00',
    '18:00',
    '12:00',
    '13:00',
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Devon',
    'emerald',
    '{2,3,4,5,6}',
    '09:00',
    '18:00',
    '13:00',
    '13:30',
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Jaylen',
    'violet',
    '{1,3,4,5,6}',
    '09:00',
    '18:00',
    '12:30',
    '13:15',
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
