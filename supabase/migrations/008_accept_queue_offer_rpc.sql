-- Migration 008: Atomic accept_queue_offer RPC
--
-- Synced to match the deployed function in Supabase.
--
-- This function is the ONLY way an anonymous user can create a queue-originated
-- appointment.  It:
--   1. Locks the queue entry (SELECT … FOR UPDATE)
--   2. Asserts status = 'offered' and offer fields are populated
--   3. Looks up service duration to compute end_time
--   4. Inserts the appointment row — all values derived from the queue entry
--   5. Deletes the queue entry
-- All within a single transaction.

CREATE OR REPLACE FUNCTION public.accept_queue_offer(p_queue_entry_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry  public.queue_entries%ROWTYPE;
  v_duration_minutes integer;
  v_end_time text;
  v_appointment_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO v_entry
    FROM public.queue_entries
   WHERE id = p_queue_entry_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found';
  END IF;

  IF v_entry.status <> 'offered' THEN
    RAISE EXCEPTION 'Queue entry is not currently offered';
  END IF;

  IF v_entry.offered_time IS NULL
     OR v_entry.offered_date IS NULL
     OR v_entry.service_id IS NULL THEN
    RAISE EXCEPTION 'Queue entry is missing required offer data';
  END IF;

  SELECT coalesce(duration_minutes, 30)
    INTO v_duration_minutes
    FROM public.services
   WHERE id::text = v_entry.service_id
   LIMIT 1;

  IF v_duration_minutes IS NULL THEN
    v_duration_minutes := 30;
  END IF;

  SELECT to_char(
    ((v_entry.offered_time)::time + make_interval(mins => v_duration_minutes)),
    'HH24:MI'
  ) INTO v_end_time;

  INSERT INTO public.appointments
    (id, barber_id, customer_name, customer_phone, customer_email,
     customer_id, service_id, start_time, end_time, date, status, from_queue)
  VALUES
    (v_appointment_id,
     coalesce(v_entry.offered_barber_id, v_entry.barber_id),
     v_entry.client_name,
     v_entry.client_phone,
     v_entry.client_email,
     v_entry.customer_id,
     v_entry.service_id,
     v_entry.offered_time,
     v_end_time,
     v_entry.offered_date::date,
     'scheduled',
     true);

  DELETE FROM public.queue_entries WHERE id = v_entry.id;

  RETURN v_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_queue_offer(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.accept_queue_offer(uuid) TO authenticated;
