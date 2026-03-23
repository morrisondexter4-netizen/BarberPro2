-- Migration 009: Add payment_method to appointments
-- Tracks cash vs card payment when a barber marks an appointment as paid.

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'card'));
