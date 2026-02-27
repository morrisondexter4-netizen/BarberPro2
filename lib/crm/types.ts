/** Service union - matches existing project (lib/types.ts) */
export type Service = "Haircut" | "Fade" | "Beard Trim" | "Haircut + Beard";

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // unique
  email: string; // required, unique
  createdAt: string; // ISO
  notes: string;
  visitCount: number;
};

export type VisitOutcome = "DONE" | "NO_SHOW";
export type VisitSource = "WALK_IN" | "BOOKED";

export type Visit = {
  id: string;
  customerId: string;
  date: string; // ISO
  barberName: string;
  service: Service;
  durationMinutes: number; // default 45
  source: VisitSource;
  outcome: VisitOutcome;
  price?: number;
  tip?: number;
  notes?: string;
};

export type CrmState = {
  customers: Customer[];
  visits: Visit[];
};

export type AddCustomerPayload = Omit<Customer, "id" | "createdAt" | "visitCount"> & {
  id?: string;
};

export type UpdateCustomerPayload = Partial<Omit<Customer, "id">>;

export type AddVisitPayload = Omit<Visit, "id"> & { id?: string };
