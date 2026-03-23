import { getSupabase } from '../supabase'
import type { QueueEntry } from '../types'

export interface QueueRow {
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
  status: string
  offered_time: string | null
  offered_date: string | null
  offered_barber_id: string | null
}

export function rowToQueueEntry(row: QueueRow): QueueEntry {
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
    status: (row.status === 'offered' ? 'offered' : 'waiting') as 'waiting' | 'offered',
    offeredTime: row.offered_time ?? undefined,
    offeredDate: row.offered_date ?? undefined,
    offeredBarberId: row.offered_barber_id ?? undefined,
  }
}

function queueEntryToRow(e: QueueEntry): QueueRow {
  return {
    id: e.id,
    barber_id: (e.barberId && e.barberId !== 'first-available') ? e.barberId : null,
    client_name: e.clientName,
    client_phone: e.clientPhone,
    client_email: e.clientEmail,
    customer_id: e.customerId ?? null,
    service_id: e.serviceId,
    wait_minutes: e.waitMinutes,
    position: e.position,
    joined_at: e.joinedAt,
    status: e.status ?? 'waiting',
    offered_time: e.offeredTime ?? null,
    offered_date: e.offeredDate ?? null,
    offered_barber_id: e.offeredBarberId ?? null,
  }
}

export async function getQueue(): Promise<QueueEntry[]> {
  const { data, error } = await getSupabase()
    .from('queue_entries')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return (data as QueueRow[]).map(rowToQueueEntry)
}

export async function saveQueueEntry(entry: QueueEntry): Promise<void> {
  const { error } = await getSupabase()
    .from('queue_entries')
    .upsert(queueEntryToRow(entry), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteQueueEntry(id: string): Promise<void> {
  const { error } = await getSupabase().from('queue_entries').delete().eq('id', id)
  if (error) throw error
}

export async function clearQueue(): Promise<void> {
  // Delete all rows — use a truthy filter that matches every row
  const { error } = await getSupabase().from('queue_entries').delete().gte('position', 0)
  if (error) throw error
}

// ── Offer flow ────────────────────────────────────────────────────────────────

export async function offerQueueSlot(
  id: string,
  offeredTime: string,
  offeredDate: string,
  offeredBarberId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('queue_entries')
    .update({
      status: 'offered',
      offered_time: offeredTime,
      offered_date: offeredDate,
      offered_barber_id: offeredBarberId,
    })
    .eq('id', id)
  if (error) throw error
}

/** Atomically accept an offered queue slot via database RPC.
 *  The function verifies the entry exists with status='offered',
 *  derives all appointment fields from the queue entry, and
 *  deletes the queue entry — all in one transaction. */
export async function acceptQueueOffer(queueEntryId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc('accept_queue_offer', {
    p_queue_entry_id: queueEntryId,
  })
  if (error) throw error
  return data as string
}

export async function declineQueueOffer(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('queue_entries')
    .update({
      status: 'waiting',
      offered_time: null,
      offered_date: null,
      offered_barber_id: null,
    })
    .eq('id', id)
  if (error) throw error
}
