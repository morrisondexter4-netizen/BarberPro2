"use client";

import * as React from "react";
import type { Customer, Visit, CrmState, AddCustomerPayload, UpdateCustomerPayload, AddVisitPayload } from "./types";
import { MOCK_CUSTOMERS, MOCK_VISITS } from "./mock";

const STORAGE_KEY = "barberpro.crm.v2";

let state: CrmState = {
  customers: [],
  visits: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((cb) => cb());
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getState(): CrmState {
  return state;
}

export function hydrate(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CrmState;
      if (Array.isArray(parsed.customers) && Array.isArray(parsed.visits)) {
        state = { customers: parsed.customers, visits: parsed.visits };
        emit();
        return;
      }
    }
  } catch {
    // ignore
  }
  state = { customers: [...MOCK_CUSTOMERS], visits: [...MOCK_VISITS] };
  emit();
}

export function persist(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function addCustomer(payload: AddCustomerPayload): Customer {
  const existingPhone = state.customers.find((c) => c.phone === payload.phone);
  if (existingPhone) throw new Error("A customer with this phone number already exists.");
  const existingEmail = state.customers.find((c) => c.email === payload.email);
  if (existingEmail) throw new Error("A customer with this email already exists.");
  const now = new Date().toISOString();
  const customer: Customer = {
    id: payload.id ?? generateId("cust"),
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    email: payload.email,
    createdAt: now,
    notes: payload.notes ?? "",
    visitCount: 0,
  };
  state = {
    ...state,
    customers: [...state.customers, customer],
  };
  emit();
  persist();
  return customer;
}

export function updateCustomer(id: string, patch: UpdateCustomerPayload): void {
  const index = state.customers.findIndex((c) => c.id === id);
  if (index === -1) return;
  if (patch.phone !== undefined) {
    const other = state.customers.find((c) => c.id !== id && c.phone === patch.phone);
    if (other) throw new Error("Another customer already has this phone number.");
  }
  if (patch.email !== undefined) {
    const other = state.customers.find((c) => c.id !== id && c.email === patch.email);
    if (other) throw new Error("Another customer already has this email.");
  }
  const updated = { ...state.customers[index], ...patch };
  const customers = [...state.customers];
  customers[index] = updated;
  state = { ...state, customers };
  emit();
  persist();
}

export function addVisit(payload: AddVisitPayload): Visit {
  const visit: Visit = {
    id: payload.id ?? generateId("v"),
    customerId: payload.customerId,
    date: payload.date,
    barberName: payload.barberName,
    service: payload.service,
    durationMinutes: payload.durationMinutes ?? 45,
    source: payload.source,
    outcome: payload.outcome,
    price: payload.price,
    tip: payload.tip,
    notes: payload.notes,
  };
  state = {
    ...state,
    visits: [...state.visits, visit],
  };
  const customerIndex = state.customers.findIndex((c) => c.id === payload.customerId);
  if (customerIndex !== -1) {
    const c = state.customers[customerIndex];
    const visitsForCustomer = state.visits.filter((v) => v.customerId === c.id);
    const visitCount = visitsForCustomer.length + 1;
    const customers = [...state.customers];
    customers[customerIndex] = { ...c, visitCount };
    state = { ...state, customers };
  }
  emit();
  persist();
  return visit;
}

export function deleteCustomer(id: string): void {
  state = {
    customers: state.customers.filter((c) => c.id !== id),
    visits: state.visits.filter((v) => v.customerId !== id),
  };
  emit();
  persist();
}

export const actions = {
  addCustomer,
  updateCustomer,
  addVisit,
  deleteCustomer,
  hydrate,
  persist,
};

export function useCrmStore(): { state: CrmState; actions: typeof actions } {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    hydrate();
    return subscribe(() => setTick((n) => n + 1));
  }, []);
  return { state: getState(), actions };
}

if (typeof window !== "undefined") {
  hydrate();
}

