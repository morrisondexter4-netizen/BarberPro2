import { getSupabase } from '../supabase'
import type { Service } from '../types'

interface ServiceRow {
  id: string
  name: string
  duration_minutes: number
  price: number
}

function rowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: row.price,
  }
}

function serviceToRow(s: Service): ServiceRow {
  return {
    id: s.id,
    name: s.name,
    duration_minutes: s.durationMinutes,
    price: s.price,
  }
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await getSupabase()
    .from('services')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ServiceRow[]).map(rowToService)
}

export async function saveServices(services: Service[]): Promise<void> {
  if (services.length === 0) return
  const rows = services.map(serviceToRow)
  const { error } = await getSupabase()
    .from('services')
    .upsert(rows, { onConflict: 'id' })
  if (error) throw error
}
