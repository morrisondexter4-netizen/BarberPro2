import type { CrmState, Customer, Visit } from "./types";

export function getCustomerById(state: CrmState, id: string): Customer | undefined {
  return state.customers.find((c) => c.id === id);
}

export function getVisitsForCustomer(state: CrmState, customerId: string): Visit[] {
  return state.visits
    .filter((v) => v.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function searchCustomers(state: CrmState, query: string): Customer[] {
  const q = query.trim().toLowerCase();
  if (!q) return state.customers;
  return state.customers.filter(
    (c) =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      c.email.toLowerCase().includes(q)
  );
}
