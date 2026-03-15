import type { QueueEntry, Appointment, Barber, Service } from './types'
import { getServiceDuration } from './settings'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Calculates accurate wait times for every queue entry.
 *
 * Algorithm:
 *  1. For each barber, find when they finish their last active appointment
 *     today (or now, whichever is later).
 *  2. Walk the queue in position order. For each entry, assign it to the
 *     barber who's free soonest ("first available").
 *  3. waitMinutes = time until that slot starts, rounded up to the minute.
 *
 * Appointments with status scheduled/checked-in block barber time.
 * Per-barber service duration overrides are respected via getServiceDuration.
 */
export function calculateQueueWaitTimes(
  queue: QueueEntry[],
  todayAppointments: Appointment[],
  barbers: Barber[],
  services: Service[],
  now: Date = new Date()
): QueueEntry[] {
  if (queue.length === 0 || barbers.length === 0) return queue

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]))
  const barberMap = Object.fromEntries(barbers.map(b => [b.id, b]))

  // Seed each barber's "next free" time from their active appointments today
  const barberFreeAt: Record<string, number> = {}
  for (const barber of barbers) {
    const activeAppts = todayAppointments.filter(
      a => a.barberId === barber.id && ['scheduled', 'checked-in'].includes(a.status)
    )
    const latestEnd = activeAppts.reduce(
      (max, a) => Math.max(max, timeToMinutes(a.endTime)),
      nowMinutes
    )
    const startMin = timeToMinutes(barber.startTime ?? '09:00')
    barberFreeAt[barber.id] = Math.max(nowMinutes, latestEnd, startMin)
  }

  const sorted = [...queue].sort((a, b) => a.position - b.position)

  return sorted.map(entry => {
    const service = serviceMap[entry.serviceId]
    if (!service) return entry

    // Pick the barber who's free soonest
    // If the entry was assigned to a specific barber (not first-available), honour that
    let assignedBarberId: string
    if (
      entry.barberId &&
      entry.barberId !== 'first-available' &&
      barberFreeAt[entry.barberId] !== undefined
    ) {
      assignedBarberId = entry.barberId
    } else {
      assignedBarberId = Object.entries(barberFreeAt).reduce(
        (best, [id, free]) => (free < barberFreeAt[best] ? id : best),
        Object.keys(barberFreeAt)[0]
      )
    }

    const freeAt = barberFreeAt[assignedBarberId]
    const barber = barberMap[assignedBarberId]
    const duration = getServiceDuration(service, barber)

    // Advance that barber's free pointer
    barberFreeAt[assignedBarberId] = freeAt + duration

    return { ...entry, waitMinutes: Math.max(0, freeAt - nowMinutes) }
  })
}

/** Human-readable wait time label */
export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return 'Now'
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

/**
 * Builds the SMS body to send to a customer after their wait time updates.
 * Matches the approved A2P template format.
 */
export function buildWaitTimeUpdateSms(clientName: string, waitMinutes: number, shopName = "Leone's Barbershop"): string {
  if (waitMinutes <= 0) {
    return `${shopName}: You're next in line! Please head to the shop now. Reply STOP to unsubscribe. Msg & data rates may apply.`
  }
  return `${shopName}: Hi ${clientName}, your updated wait time is approximately ${waitMinutes} minutes. We'll notify you when your barber is ready. Reply STOP to unsubscribe. Msg & data rates may apply.`
}
