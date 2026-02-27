export type Service = "Haircut" | "Fade" | "Beard Trim" | "Haircut + Beard";

export type Barber = {
  id: string;
  name: string;
  color: string; // tailwind bg color class e.g. "bg-blue-500"
};

export type QueueEntry = {
  id: string;
  name: string;
  service: Service;
  waitMinutes: number;
  barberId: string; // which barber they're assigned to
  position: number; // 1 = first in line
};

export type Appointment = {
  id: string;
  name: string;
  service: Service;
  barberId: string;
  startTime: string; // "HH:MM" 24hr
  endTime: string;   // "HH:MM" 24hr
  date: string;      // "YYYY-MM-DD"
  fromQueue?: boolean; // true if dragged in from queue
};
