export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

export type Barber = {
  id: string;
  name: string;
  color: string;
  workDays: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  startTime: string;  // "HH:MM" 24hr
  endTime: string;    // "HH:MM" 24hr
  lunchBreak?: { start: string; end: string };
  serviceDurations?: Record<string, number>; // serviceId → minutes override
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  noShows: number;
  noShowCount?: number;
  totalVisits: number;
  createdAt: string;
};

export type QueueEntry = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  customerId?: string;
  serviceId: string;
  waitMinutes: number;
  barberId: string;
  position: number;
  joinedAt: string;
};

export type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  customerId?: string;
  serviceId: string;
  barberId: string;
  startTime: string;
  endTime: string;
  date: string;
  status: "scheduled" | "checked-in" | "no-show" | "paid" | "cancelled";
  fromQueue?: boolean;
};

export type DashboardView = {
  barberId: string;
  date: string;
};

export type ShopHours = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

export type ShopSettings = {
  shopName: string;
  address: string;
  phone: string;
  hours: Record<string, ShopHours>;
  barbers: Barber[];
  services: Service[];
};
