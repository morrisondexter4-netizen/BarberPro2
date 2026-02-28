"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Appointment, QueueEntry } from "./types";
import { loadAppointments, saveAppointments, loadQueue, saveQueue } from "./settings";

type BarberProContextType = {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  queue: QueueEntry[];
  setQueue: React.Dispatch<React.SetStateAction<QueueEntry[]>>;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  moveAppointment: (id: string, newStartTime: string, newEndTime: string) => void;
  cancelAppointment: (id: string) => void;
  addAppointment: (apt: Appointment) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (entry: QueueEntry) => void;
};

const BarberProContext = createContext<BarberProContextType | null>(null);

export function BarberProProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAppointments(loadAppointments());
    setQueue(loadQueue());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveAppointments(appointments);
  }, [appointments, hydrated]);

  useEffect(() => {
    if (hydrated) saveQueue(queue);
  }, [queue, hydrated]);

  const updateAppointmentStatus = (id: string, status: Appointment["status"]) =>
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

  const moveAppointment = (id: string, newStartTime: string, newEndTime: string) =>
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, startTime: newStartTime, endTime: newEndTime } : a));

  const cancelAppointment = (id: string) =>
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));

  const addAppointment = (apt: Appointment) =>
    setAppointments(prev => [...prev, apt]);

  const removeFromQueue = (id: string) =>
    setQueue(prev => prev.filter(e => e.id !== id).map((e, i) => ({ ...e, position: i + 1 })));

  const addToQueue = (entry: QueueEntry) =>
    setQueue(prev => [...prev, { ...entry, position: prev.length + 1 }]);

  if (!hydrated) return null;

  return (
    <BarberProContext.Provider value={{
      appointments, setAppointments,
      queue, setQueue,
      updateAppointmentStatus,
      moveAppointment,
      cancelAppointment,
      addAppointment,
      removeFromQueue,
      addToQueue,
    }}>
      {children}
    </BarberProContext.Provider>
  );
}

export function useBarberPro() {
  const ctx = useContext(BarberProContext);
  if (!ctx) throw new Error("useBarberPro must be used within BarberProProvider");
  return ctx;
}
