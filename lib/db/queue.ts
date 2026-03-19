import { supabase } from '../supabase'
import type { QueueEntry, Appointment } from '../types'

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

// ── Offer flow ────────────────────────────────────────────────────────────────

export async function offerQueueSlot(
  id: string,
  offeredTime: string,
  offeredDate: string,
  offeredBarberId: string
): Promise<void> {
  const { error } = await supabase
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

export async function acceptQueueOffer(
  entry: QueueEntry,
  appointment: Appointment
): Promise<void> {
  // Insert appointment then delete queue entry
  const aptRow = {
    id: appointment.id,
    barber_id: appointment.barberId || null,
    customer_name: appointment.clientName,
    customer_phone: appointment.clientPhone,
    customer_email: appointment.clientEmail,
    customer_id: appointment.customerId ?? null,
    service_id: appointment.serviceId,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    date: appointment.date,
    status: appointment.status,
    from_queue: appointment.fromQueue ?? true,
  }

  const { error: insertError } = await supabase
    .from('appointments')
    .insert(aptRow)
  if (insertError) throw insertError

  const { error: deleteError } = await supabase
    .from('queue_entries')
    .delete()
    .eq('id', entry.id)
  if (deleteError) {
    // Rollback: remove the appointment we just inserted
    await supabase.from('appointments').delete().eq('id', appointment.id)
    throw deleteError
  }
}

export async function declineQueueOffer(id: string): Promise<void> {
  const { error } = await supabase
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
