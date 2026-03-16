import { Barber, Service, QueueEntry, Appointment } from "./types";

export const SERVICES: Service[] = [
  { id: "s1", name: "Haircut", durationMinutes: 30, price: 25 },
  { id: "s2", name: "Fade", durationMinutes: 45, price: 35 },
  { id: "s3", name: "Beard Trim", durationMinutes: 20, price: 12 },
  { id: "s4", name: "Haircut + Beard", durationMinutes: 60, price: 45 },
];

export const BARBERS: Barber[] = [
  { id: "b1", name: "Marcus", color: "blue", workDays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", lunchBreak: { start: "12:00", end: "13:00" } },
  { id: "b2", name: "Devon", color: "emerald", workDays: [2, 3, 4, 5, 6], startTime: "09:00", endTime: "18:00", lunchBreak: { start: "13:00", end: "13:30" } },
  { id: "b3", name: "Jaylen", color: "violet", workDays: [1, 3, 4, 5, 6], startTime: "09:00", endTime: "18:00", lunchBreak: { start: "12:30", end: "13:15" } },
];

const today = new Date().toISOString().split("T")[0];

export const INITIAL_QUEUE: QueueEntry[] = [
  { id: "q1", clientName: "Michael Thompson", clientPhone: "", clientEmail: "", serviceId: "s2", waitMinutes: 5,  barberId: "b1", position: 1, joinedAt: new Date().toISOString() },
  { id: "q2", clientName: "William Martinez", clientPhone: "", clientEmail: "", serviceId: "s4", waitMinutes: 18, barberId: "b1", position: 2, joinedAt: new Date().toISOString() },
  { id: "q3", clientName: "Joseph Anderson", clientPhone: "", clientEmail: "", serviceId: "s1", waitMinutes: 32, barberId: "b2", position: 1, joinedAt: new Date().toISOString() },
  { id: "q4", clientName: "Christopher Thomas", clientPhone: "", clientEmail: "", serviceId: "s3", waitMinutes: 45, barberId: "b2", position: 2, joinedAt: new Date().toISOString() },
  { id: "q5", clientName: "Matthew Jackson", clientPhone: "", clientEmail: "", serviceId: "s2", waitMinutes: 58, barberId: "b3", position: 1, joinedAt: new Date().toISOString() },
  { id: "q6", clientName: "James Wilson", clientPhone: "", clientEmail: "", serviceId: "s1", waitMinutes: 70, barberId: "b3", position: 2, joinedAt: new Date().toISOString() },
  { id: "q7", clientName: "Aiden Brooks", clientPhone: "+1 555-201-1019", clientEmail: "abrooks@gmail.com", serviceId: "s2", waitMinutes: 85, barberId: "b1", position: 3, joinedAt: new Date().toISOString() },
  { id: "q8", clientName: "Tyler Nguyen", clientPhone: "+1 555-201-1020", clientEmail: "tnguyen@outlook.com", serviceId: "s1", waitMinutes: 60, barberId: "b2", position: 3, joinedAt: new Date().toISOString() },
  { id: "q9", clientName: "DeShawn Mitchell", clientPhone: "+1 555-201-1023", clientEmail: "dmitchell@email.com", serviceId: "s4", waitMinutes: 90, barberId: "b2", position: 4, joinedAt: new Date().toISOString() },
  { id: "q10", clientName: "Jordan Price", clientPhone: "+1 555-201-1021", clientEmail: "jprice@email.com", serviceId: "s1", waitMinutes: 95, barberId: "b3", position: 3, joinedAt: new Date().toISOString() },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", clientName: "James Wilson", clientPhone: "", clientEmail: "", serviceId: "s1", barberId: "b1", startTime: "09:00", endTime: "09:30", date: today, status: "scheduled" },
  { id: "a2", clientName: "Marcus Chen", clientPhone: "", clientEmail: "", serviceId: "s2", barberId: "b1", startTime: "10:00", endTime: "10:45", date: today, status: "scheduled" },
  { id: "a3", clientName: "David Rodriguez", clientPhone: "", clientEmail: "", serviceId: "s3", barberId: "b1", startTime: "14:00", endTime: "14:20", date: today, status: "scheduled" },
  { id: "a5", clientName: "Robert Garcia", clientPhone: "", clientEmail: "", serviceId: "s4", barberId: "b2", startTime: "09:00", endTime: "10:00", date: today, status: "scheduled" },
  { id: "a7", clientName: "Daniel Taylor", clientPhone: "", clientEmail: "", serviceId: "s1", barberId: "b3", startTime: "10:00", endTime: "10:30", date: today, status: "scheduled" },
];
