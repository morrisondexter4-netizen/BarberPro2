"use client";
import { Barber, Service, ShopHours, Customer, Appointment, QueueEntry } from "./types";
import { BARBERS, SERVICES, INITIAL_APPOINTMENTS, INITIAL_QUEUE } from "./mock-data";

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

// BARBERS
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

export function saveBarbers(barbers: Barber[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.barbers, JSON.stringify(barbers));
}

// SERVICES
export function loadServices(): Service[] {
  if (!isBrowser()) return SERVICES;
  try {
    const raw = localStorage.getItem(KEYS.services);
    if (!raw) return SERVICES;
    return JSON.parse(raw);
  } catch { return SERVICES; }
}

export function saveServices(services: Service[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.services, JSON.stringify(services));
}

// SHOP SETTINGS (name, address, phone, hours)
export function loadShopSettings() {
  if (!isBrowser()) return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() };
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() };
    return JSON.parse(raw);
  } catch { return { shopName: "Classic Cuts", address: "", phone: "", hours: defaultHours() }; }
}

export function saveShopSettings(s: { shopName: string; address: string; phone: string; hours: Record<string, ShopHours> }) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

// APPOINTMENTS
export function loadAppointments(): Appointment[] {
  if (!isBrowser()) return INITIAL_APPOINTMENTS;
  try {
    const raw = localStorage.getItem(KEYS.appointments);
    if (!raw) return INITIAL_APPOINTMENTS;
    return JSON.parse(raw);
  } catch { return INITIAL_APPOINTMENTS; }
}

export function saveAppointments(appointments: Appointment[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.appointments, JSON.stringify(appointments));
}

// QUEUE
export function loadQueue(): QueueEntry[] {
  if (!isBrowser()) return INITIAL_QUEUE;
  try {
    const raw = localStorage.getItem(KEYS.queue);
    if (!raw) return INITIAL_QUEUE;
    return JSON.parse(raw);
  } catch { return INITIAL_QUEUE; }
}

export function saveQueue(queue: QueueEntry[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.queue, JSON.stringify(queue));
}

// CUSTOMERS
export function loadCustomers(): Customer[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.customers);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveCustomers(customers: Customer[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.customers, JSON.stringify(customers));
}

// Find or create customer by phone number
export function upsertCustomer(name: string, phone: string, email: string): Customer {
  const customers = loadCustomers();
  const existing = customers.find(c => c.phone === phone);
  if (existing) {
    const updated = { ...existing, name, email };
    saveCustomers(customers.map(c => c.phone === phone ? updated : c));
    return updated;
  }
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name,
    phone,
    email,
    noShows: 0,
    totalVisits: 0,
    createdAt: new Date().toISOString(),
  };
  saveCustomers([...customers, newCustomer]);
  return newCustomer;
}
