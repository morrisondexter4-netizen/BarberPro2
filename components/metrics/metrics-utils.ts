import { Appointment } from "@/lib/types";

export const SERVICE_PRICES: Record<string, number> = {
  s1: 30,
  s2: 45,
  s3: 20,
  s4: 60,
};

export type TimePeriod = "day" | "week" | "month";

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function filterByTimePeriod(
  appointments: Appointment[],
  period: TimePeriod
): Appointment[] {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (period === "day") {
    return appointments.filter((a) => a.date === todayStr);
  }

  if (period === "week") {
    const monday = getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return appointments.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d >= monday && d <= sunday;
    });
  }

  // month
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    return d >= firstDay && d <= lastDay;
  });
}

export function filterByBarber(
  appointments: Appointment[],
  barberId: string
): Appointment[] {
  if (barberId === "all") return appointments;
  return appointments.filter((a) => a.barberId === barberId);
}

export type MetricData = {
  revenue: number;
  totalAppointments: number;
  clientsServed: number;
  noShows: number;
};

export function calculateMetrics(appointments: Appointment[]): MetricData {
  const paid = appointments.filter((a) => a.status === "paid");

  const revenue = paid.reduce(
    (sum, a) => sum + (SERVICE_PRICES[a.serviceId] ?? 0),
    0
  );

  return {
    revenue,
    totalAppointments: appointments.length,
    clientsServed: paid.length,
    noShows: appointments.filter((a) => a.status === "no-show").length,
  };
}
