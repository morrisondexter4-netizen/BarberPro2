import { supabase } from '../supabase'
import type { Barber } from '../types'

// ── Row shape returned by Supabase ──────────────────────────────────────────
interface BarberRow {
  id: string
  name: string
  color: string
  work_days: number[]
  start_time: string
  end_time: string
  lunch_start: string | null
  lunch_end: string | null
  service_durations: Record<string, number>
}

function rowToBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    workDays: row.work_days ?? [],
    startTime: row.start_time,
    endTime: row.end_time,
    lunchBreak:
      row.lunch_start && row.lunch_end
        ? { start: row.lunch_start, end: row.lunch_end }
        : undefined,
    serviceDurations:
      row.service_durations && Object.keys(row.service_durations).length > 0
        ? row.service_durations
        : undefined,
  }
}

function barberToRow(b: Barber): Omit<BarberRow, 'id'> & { id: string } {
  return {
    id: b.id,
    name: b.name,
    color: b.color,
    work_days: b.workDays,
    start_time: b.startTime,
    end_time: b.endTime,
    lunch_start: b.lunchBreak?.start ?? null,
    lunch_end: b.lunchBreak?.end ?? null,
    service_durations: b.serviceDurations ?? {},
  }
}

export async function getBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as BarberRow[]).map(rowToBarber)
}

export async function saveBarbers(barbers: Barber[]): Promise<void> {
  if (barbers.length === 0) return
  const rows = barbers.map(barberToRow)
  const { error } = await supabase
    .from('barbers')
    .upsert(rows, { onConflict: 'id' })
  if (error) throw error
}
