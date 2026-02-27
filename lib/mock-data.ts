import { Barber, QueueEntry, Appointment } from "./types";

export const BARBERS: Barber[] = [
  { id: "b1", name: "Marcus", color: "bg-blue-500" },
  { id: "b2", name: "Devon", color: "bg-emerald-500" },
  { id: "b3", name: "Jaylen", color: "bg-violet-500" },
];

// Today's date as YYYY-MM-DD
const today = new Date().toISOString().split("T")[0];

export const INITIAL_QUEUE: QueueEntry[] = [
  { id: "q1", name: "Marcus T.", service: "Fade", waitMinutes: 5, barberId: "b1", position: 1 },
  { id: "q2", name: "DeShawn K.", service: "Haircut + Beard", waitMinutes: 18, barberId: "b2", position: 2 },
  { id: "q3", name: "Jordan M.", service: "Haircut", waitMinutes: 32, barberId: "b1", position: 3 },
  { id: "q4", name: "Tyler R.", service: "Beard Trim", waitMinutes: 45, barberId: "b3", position: 4 },
  { id: "q5", name: "Brendan S.", service: "Fade", waitMinutes: 58, barberId: "b2", position: 5 },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", name: "Chris P.", service: "Haircut", barberId: "b1", startTime: "09:00", endTime: "09:30", date: today },
  { id: "a2", name: "Antoine L.", service: "Fade", barberId: "b2", startTime: "10:00", endTime: "10:45", date: today },
  { id: "a3", name: "Kevin W.", service: "Haircut + Beard", barberId: "b3", startTime: "11:00", endTime: "12:00", date: today },
  { id: "a4", name: "Ray J.", service: "Beard Trim", barberId: "b1", startTime: "13:00", endTime: "13:30", date: today },
  { id: "a5", name: "Open Slot", service: "Haircut", barberId: "b2", startTime: "14:00", endTime: "14:30", date: today },
  { id: "a6", name: "Open Slot", service: "Haircut", barberId: "b3", startTime: "14:30", endTime: "15:00", date: today },
];
