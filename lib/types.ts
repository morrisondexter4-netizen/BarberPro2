export type Service = {
  id: string;
  name: string;
  durationMinutes: number; // placeholder, will be set in Shop Settings later
};

export type Barber = {
  id: string;
  name: string;
  color: string; // tailwind color name e.g. "blue", "emerald", "violet"
  workDays: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  lunchBreak?: { start: string; end: string }; // "HH:MM" 24-hour
};

export type QueueEntry = {
  id: string;
  clientName: string;
  serviceId: string;
  waitMinutes: number;
  barberId: string;
  position: number;
  joinedAt: string; // ISO timestamp
};

export type Appointment = {
  id: string;
  clientName: string;
  serviceId: string;
  barberId: string;
  startTime: string; // "HH:MM" 24hr
  endTime: string;   // "HH:MM" 24hr
  date: string;      // "YYYY-MM-DD"
  status: "scheduled" | "checked-in" | "no-show" | "paid" | "cancelled";
  fromQueue?: boolean;
};

export type DashboardView = {
  barberId: string;
  date: string;
};
