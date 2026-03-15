import { supabase } from '../supabase'
import type { QueueEntry } from '../types'

interface QueueRow {
  id: string
  barber_id: string | null
  client_name: string
  client_phone: string
  client_email: string
  customer_id: string | null
  service_id: string
  wait_minutes: number
  position: number
  joined_at: string
}

function rowToQueueEntry(row: QueueRow): QueueEntry {
  return {
    id: row.id,
    barberId: row.barber_id ?? '',
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    customerId: row.customer_id ?? undefined,
    serviceId: row.service_id,
    waitMinutes: row.wait_minutes,
    position: row.position,
    joinedAt: row.joined_at,
  }
}

function queueEntryToRow(e: QueueEntry): QueueRow {
  return {
    id: e.id,
    barber_id: e.barberId || null,
    client_name: e.clientName,
    client_phone: e.clientPhone,
    client_email: e.clientEmail,
    customer_id: e.customerId ?? null,
    service_id: e.serviceId,
    wait_minutes: e.waitMinutes,
    position: e.position,
    joined_at: e.joinedAt,
  }
}

export async function getQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return (data as QueueRow[]).map(rowToQueueEntry)
}

export async function saveQueueEntry(entry: QueueEntry): Promise<void> {
  const { error } = await supabase
    .from('queue_entries')
    .upsert(queueEntryToRow(entry), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteQueueEntry(id: string): Promise<void> {
  const { error } = await supabase.from('queue_entries').delete().eq('id', id)
  if (error) throw error
}

export async function clearQueue(): Promise<void> {
  // Delete all rows — use a truthy filter that matches every row
  const { error } = await supabase.from('queue_entries').delete().gte('position', 0)
  if (error) throw error
}
