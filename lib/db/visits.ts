import { getSupabase } from '../supabase'
import type { Visit } from '../crm/types'

interface VisitRow {
  id: string
  customer_id: string
  date: string
  barber_name: string
  service: string
  duration_minutes: number
  source: string
  outcome: string
  price: number | null
  tip: number | null
  notes: string | null
}

function rowToVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    customerId: row.customer_id,
    date: row.date,
    barberName: row.barber_name,
    service: row.service as Visit['service'],
    durationMinutes: row.duration_minutes,
    source: row.source as Visit['source'],
    outcome: row.outcome as Visit['outcome'],
    price: row.price ?? undefined,
    tip: row.tip ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function visitToRow(v: Visit): VisitRow {
  return {
    id: v.id,
    customer_id: v.customerId,
    date: v.date,
    barber_name: v.barberName,
    service: v.service,
    duration_minutes: v.durationMinutes,
    source: v.source,
    outcome: v.outcome,
    price: v.price ?? null,
    tip: v.tip ?? null,
    notes: v.notes ?? null,
  }
}

export async function getVisits(customerId?: string): Promise<Visit[]> {
  let query = getSupabase()
    .from('visits')
    .select('*')
    .order('date', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as VisitRow[]).map(rowToVisit)
}

export async function saveVisit(visit: Visit): Promise<void> {
  const { error } = await getSupabase()
    .from('visits')
    .upsert(visitToRow(visit), { onConflict: 'id' })
  if (error) throw error
}
