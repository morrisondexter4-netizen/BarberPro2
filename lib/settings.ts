"use client";
import { Barber, Service, ShopHours, Customer, Appointment, QueueEntry } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export { localDateString } from "./date-utils";

/**
 * Returns the effective duration for a service, respecting any per-barber
 * override. Falls back to the global service duration if no override is set.
 */
export function getServiceDuration(service: Service, barber?: Barber): number {
  return barber?.serviceDurations?.[service.id] ?? service.durationMinutes;
}
import { BARBERS, SERVICES, INITIAL_APPOINTMENTS, INITIAL_QUEUE } from "./mock-data";
import { isSupabaseConfigured, getSupabase } from "./supabase";
import * as dbBarbers from "./db/barbers";
import * as dbServices from "./db/services";
import * as dbAppointments from "./db/appointments";
import * as dbQueue from "./db/queue";
import * as dbShopSettings from "./db/shop-settings";

const KEYS = {
  settings: "barberpro.shopSettings",
  barbers: "barberpro.shopSettings.barbers",
  services: "barberpro.services",
  customers: "barberpro.customers",
  appointments: "barberpro.appointments",
  queue: "barberpro.queue",
};

function defaultHours(): Record<string, ShopHours> {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Object.fromEntries(
    days.map(d => [d, { open: d !== "Sun", openTime: "09:00", closeTime: "18:00" }])
  );
}

function isBrowser() { return typeof window !== "undefined"; }

// ─────────────────────────────────────────────────────────────────────────────
// BARBERS
// ─────────────────────────────────────────────────────────────────────────────
export function loadBarbers(): Barber[] {
  if (!isBrowser()) return BARBERS;
  try {
    const raw = localStorage.getItem(KEYS.barbers);
    if (!raw) return BARBERS;
    const parsed = JSON.parse(raw);
    return parsed.map((b: any) => ({
      ...b,
      startTime: b.startTime ?? "09:00",
      endTime: b.endTime ?? "18:00",
    }));
  } catch { return BARBERS; }
}

export function saveBarbers(barbers: Barber[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.barbers, JSON.stringify(barbers));
  if (isSupabaseConfigured()) {
    dbBarbers.saveBarbers(barbers).catch(console.error);
  }
}

export async function loadBarbersAsync(): Promise<Barber[]> {
  if (isSupabaseConfigured()) {
    try {
      return await dbBarbers.getBarbers(); // trust Supabase even if empty
    } catch { /* fall through to localStorage */ }
  }
  return loadBarbers();
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export function loadServices(): Service[] {
  if (!isBrowser()) return SERVICES;
  try {
    const raw = localStorage.getItem(KEYS.services);
    if (!raw) return SERVICES;
    return JSON.parse(raw);
  } catch { return SERVICES; }
}

export function saveServices(services: Service[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.services, JSON.stringify(services));
  if (isSupabaseConfigured()) {
    dbServices.saveServices(services).catch(console.error);
  }
}

export async function loadServicesAsync(): Promise<Service[]> {
  if (isSupabaseConfigured()) {
    try {
      return await dbServices.getServices(); // trust Supabase even if empty
    } catch { /* fall through to localStorage */ }
  }
  return loadServices();
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOP SETTINGS (name, address, phone, hours)
// ─────────────────────────────────────────────────────────────────────────────
export function loadShopSettings() {
  if (!isBrowser()) return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() };
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() };
    return JSON.parse(raw);
  } catch { return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() }; }
}

export function saveShopSettings(s: { shopName: string; address: string; phone: string; hours: Record<string, ShopHours> }): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
  if (isSupabaseConfigured()) {
    // ShopSettings in db expects the full type including barbers/services arrays;
    // pass empty arrays since those are managed separately.
    dbShopSettings.saveShopSettings({ ...s, barbers: [], services: [] }).catch(console.error);
  }
}

export async function loadShopSettingsAsync(): Promise<{ shopName: string; address: string; phone: string; hours: Record<string, ShopHours> }> {
  if (isSupabaseConfigured()) {
    try {
      const settings = await dbShopSettings.getShopSettings();
      if (settings) {
        return { shopName: settings.shopName, address: settings.address, phone: settings.phone, hours: settings.hours };
      }
    } catch { /* fall through to localStorage */ }
  }
  return loadShopSettings();
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
export function loadAppointments(): Appointment[] {
  if (!isBrowser()) return INITIAL_APPOINTMENTS;
  try {
    const raw = localStorage.getItem(KEYS.appointments);
    if (!raw) return INITIAL_APPOINTMENTS;
    return JSON.parse(raw);
  } catch { return INITIAL_APPOINTMENTS; }
}

export function saveAppointments(appointments: Appointment[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.appointments, JSON.stringify(appointments));
}

export async function loadAppointmentsAsync(): Promise<Appointment[]> {
  if (isSupabaseConfigured()) {
    try {
      return await dbAppointments.getAppointments();
    } catch { /* fall through to localStorage */ }
  }
  return loadAppointments();
}

// PII-stripped slot data for public-facing availability checks
export type AppointmentSlot = { barberId: string; date: string; startTime: string; endTime: string; status: string };

export function loadAppointmentSlots(): AppointmentSlot[] {
  return loadAppointments().map(({ barberId, date, startTime, endTime, status }) => ({
    barberId, date, startTime, endTime, status,
  }));
}

export async function persistAppointment(appt: Appointment): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbAppointments.saveAppointment(appt);
  }
}

export async function persistUpdateAppointment(appt: Appointment): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbAppointments.updateAppointment(appt);
  }
}

export async function persistDeleteAppointment(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbAppointments.deleteAppointment(id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE
// ─────────────────────────────────────────────────────────────────────────────
export function loadQueue(): QueueEntry[] {
  if (!isBrowser()) return INITIAL_QUEUE;
  try {
    const raw = localStorage.getItem(KEYS.queue);
    if (!raw) return INITIAL_QUEUE;
    return JSON.parse(raw);
  } catch { return INITIAL_QUEUE; }
}

export function saveQueue(queue: QueueEntry[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.queue, JSON.stringify(queue));
}

export async function loadQueueAsync(): Promise<QueueEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      const q = await dbQueue.getQueue();
      if (q.length > 0) return q;
    } catch { /* fall through to localStorage */ }
  }
  return loadQueue();
}

export async function persistQueueEntry(entry: QueueEntry): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbQueue.saveQueueEntry(entry);
  }
}

export async function persistDeleteQueueEntry(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbQueue.deleteQueueEntry(id);
  }
}

export async function persistClearQueue(): Promise<void> {
  if (isSupabaseConfigured()) {
    await dbQueue.clearQueue();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS  (lib/types.ts Customer — used outside CRM for appointment lookups)
// ─────────────────────────────────────────────────────────────────────────────
export function loadCustomers(): Customer[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.customers);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveCustomers(customers: Customer[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.customers, JSON.stringify(customers));
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
}

function customerToRow(c: Customer) {
  const { first, last } = splitName(c.name);
  return {
    id: c.id,
    first_name: first,
    last_name: last,
    phone: c.phone,
    email: c.email,
    visit_count: c.totalVisits,
  };
}

// Find or create customer by phone number
export function upsertCustomer(name: string, phone: string, email: string): Customer {
  const customers = loadCustomers();
  const existing = customers.find(c => c.phone === phone);
  if (existing) {
    const updated = { ...existing, name, email };
    saveCustomers(customers.map(c => c.phone === phone ? updated : c));
    if (isSupabaseConfigured()) {
      getSupabase().from('customers').upsert(
        customerToRow(updated),
        { onConflict: 'id' }
      ).then((result: { error: unknown }) => { if (result.error) console.error('customer upsert:', result.error) })
       .catch(() => {});
    }
    return updated;
  }
  const newCustomer: Customer = {
    id: crypto.randomUUID(),
    name,
    phone,
    email,
    noShows: 0,
    totalVisits: 0,
    createdAt: new Date().toISOString(),
  };
  saveCustomers([...customers, newCustomer]);
  if (isSupabaseConfigured()) {
    getSupabase().from('customers').upsert(
      customerToRow(newCustomer),
      { onConflict: 'id' }
    ).then((result: { error: unknown }) => { if (result.error) console.error('customer upsert:', result.error) })
     .catch(() => {});
  }
  return newCustomer;
}
