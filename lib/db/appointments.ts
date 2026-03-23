import { getSupabase } from '../supabase'
import type { Appointment } from '../types'

interface AppointmentRow {
  id: string
  barber_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_id: string | null
  service_id: string
  start_time: string
  end_time: string
  date: string
  status: string
  from_queue: boolean
  payment_method: string | null
}

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    barberId: row.barber_id ?? '',
    clientName: row.customer_name,
    clientPhone: row.customer_phone,
    clientEmail: row.customer_email,
    customerId: row.customer_id ?? undefined,
    serviceId: row.service_id,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
    status: row.status as Appointment['status'],
    fromQueue: row.from_queue,
    paymentMethod: (row.payment_method as 'cash' | 'card') ?? undefined,
  }
}

function appointmentToRow(a: Appointment): AppointmentRow {
  return {
    id: a.id,
    barber_id: a.barberId || null,
    customer_name: a.clientName,
    customer_phone: a.clientPhone,
    customer_email: a.clientEmail,
    customer_id: a.customerId ?? null,
    service_id: a.serviceId,
    start_time: a.startTime,
    end_time: a.endTime,
    date: a.date,
    status: a.status,
    from_queue: a.fromQueue ?? false,
    payment_method: a.paymentMethod ?? null,
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await getSupabase()
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return (data as AppointmentRow[]).map(rowToAppointment)
}

export async function saveAppointment(appt: Appointment): Promise<void> {
  const { error } = await getSupabase()
    .from('appointments')
    .insert(appointmentToRow(appt))
  if (error) throw error
}

export async function updateAppointment(appt: Appointment): Promise<void> {
  const { error } = await getSupabase()
    .from('appointments')
    .upsert(appointmentToRow(appt), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await getSupabase().from('appointments').delete().eq('id', id)
  if (error) throw error
}
