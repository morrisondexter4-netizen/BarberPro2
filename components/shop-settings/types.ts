/** Local types for Shop Settings page only. Do not import from lib/types. */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayKey = (typeof DAYS)[number];

export interface DayHours {
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface ShopDetailsState {
  shopName: string;
  address: string;
  phone: string;
  hours: Record<DayKey, DayHours>;
}

export type BarberColor = "blue" | "emerald" | "violet" | "amber" | "rose";

export interface Barber {
  id: string;
  name: string;
  color: BarberColor;
  workingDays: DayKey[];
  startTime: string;
  endTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
