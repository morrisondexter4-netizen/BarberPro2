import { Barber, Service, QueueEntry, Appointment } from "./types";

export const SERVICES: Service[] = [
  { id: "s1", name: "Haircut", durationMinutes: 30 },
  { id: "s2", name: "Fade", durationMinutes: 45 },
  { id: "s3", name: "Beard Trim", durationMinutes: 20 },
  { id: "s4", name: "Haircut + Beard", durationMinutes: 60 },
];

export const BARBERS: Barber[] = [
  {
    id: "b1",
    name: "Marcus",
    color: "blue",
    workDays: [1, 2, 3, 4, 5],
    lunchBreak: { start: "12:00", end: "13:00" },
  },
  {
    id: "b2",
    name: "Devon",
    color: "emerald",
    workDays: [2, 3, 4, 5, 6],
    lunchBreak: { start: "13:00", end: "13:30" },
  },
  {
    id: "b3",
    name: "Jaylen",
    color: "violet",
    workDays: [1, 3, 4, 5, 6],
    lunchBreak: { start: "12:30", end: "13:15" },
  },
];

const today = new Date().toISOString().split("T")[0];

export const INITIAL_QUEUE: QueueEntry[] = [
  { id: "q1", clientName: "Marcus T.", serviceId: "s2", waitMinutes: 5,  barberId: "b1", position: 1, joinedAt: new Date().toISOString() },
  { id: "q2", clientName: "DeShawn K.", serviceId: "s4", waitMinutes: 18, barberId: "b1", position: 2, joinedAt: new Date().toISOString() },
  { id: "q3", clientName: "Jordan M.", serviceId: "s1", waitMinutes: 32, barberId: "b2", position: 1, joinedAt: new Date().toISOString() },
  { id: "q4", clientName: "Tyler R.", serviceId: "s3", waitMinutes: 45, barberId: "b2", position: 2, joinedAt: new Date().toISOString() },
  { id: "q5", clientName: "Brendan S.", serviceId: "s2", waitMinutes: 58, barberId: "b3", position: 1, joinedAt: new Date().toISOString() },
  { id: "q6", clientName: "Chris W.", serviceId: "s1", waitMinutes: 70, barberId: "b3", position: 2, joinedAt: new Date().toISOString() },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", clientName: "Chris P.",   serviceId: "s1", barberId: "b1", startTime: "09:00", endTime: "09:30", date: today, status: "scheduled" },
  { id: "a2", clientName: "Antoine L.", serviceId: "s2", barberId: "b1", startTime: "10:00", endTime: "10:45", date: today, status: "scheduled" },
  { id: "a3", clientName: "Ray J.",     serviceId: "s3", barberId: "b1", startTime: "14:00", endTime: "14:20", date: today, status: "scheduled" },
  { id: "a5", clientName: "Kevin W.",   serviceId: "s4", barberId: "b2", startTime: "09:00", endTime: "10:00", date: today, status: "scheduled" },
  { id: "a7", clientName: "Malik B.",   serviceId: "s1", barberId: "b3", startTime: "10:00", endTime: "10:30", date: today, status: "scheduled" },
];
