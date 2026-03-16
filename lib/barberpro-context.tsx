"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Appointment, QueueEntry, Barber, Service } from "./types";
import {
  saveAppointments,
  saveQueue,
  loadAppointmentsAsync, loadQueueAsync,
  loadBarbersAsync, saveBarbers,
  loadServicesAsync, saveServices,
  persistAppointment, persistUpdateAppointment,
  persistQueueEntry, persistDeleteQueueEntry,
} from "./settings";
import { isSupabaseConfigured } from "./supabase";

type BarberProContextType = {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  queue: QueueEntry[];
  setQueue: React.Dispatch<React.SetStateAction<QueueEntry[]>>;
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
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
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from Supabase on startup; fall back to localStorage if Supabase is not configured.
  // localStorage save effects below act as a local cache after hydration.
  useEffect(() => {
    Promise.all([loadAppointmentsAsync(), loadQueueAsync(), loadBarbersAsync(), loadServicesAsync()])
      .then(([appts, q, b, s]) => {
        setAppointments(appts);
        setQueue(q);
        setBarbers(b);
        setServices(s);
      })
      .catch(console.error)
      .finally(() => setHydrated(true));
  }, []);

  // localStorage cache — kept as fallback. Only fires after hydration to avoid
  // overwriting stored data with the empty initial state.
  useEffect(() => {
    if (hydrated) saveAppointments(appointments);
  }, [appointments, hydrated]);

  useEffect(() => {
    if (hydrated) saveQueue(queue);
  }, [queue, hydrated]);

  useEffect(() => {
    if (hydrated && barbers.length > 0) saveBarbers(barbers);
  }, [barbers, hydrated]);

  useEffect(() => {
    if (hydrated && services.length > 0) saveServices(services);
  }, [services, hydrated]);

  const updateAppointmentStatus = (id: string, status: Appointment["status"]) =>
    setAppointments(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status } : a);
      if (isSupabaseConfigured()) {
        const appt = next.find(a => a.id === id);
        if (appt) persistUpdateAppointment(appt).catch(console.error);
      }
      return next;
    });

  const moveAppointment = (id: string, newStartTime: string, newEndTime: string) =>
    setAppointments(prev => {
      const next = prev.map(a =>
        a.id === id ? { ...a, startTime: newStartTime, endTime: newEndTime } : a
      );
      if (isSupabaseConfigured()) {
        const appt = next.find(a => a.id === id);
        if (appt) persistUpdateAppointment(appt).catch(console.error);
      }
      return next;
    });

  const cancelAppointment = (id: string) =>
    setAppointments(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status: "cancelled" as const } : a);
      if (isSupabaseConfigured()) {
        const appt = next.find(a => a.id === id);
        if (appt) persistUpdateAppointment(appt).catch(console.error);
      }
      return next;
    });

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
    if (isSupabaseConfigured()) {
      persistAppointment(apt).catch(console.error);
    }
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(e => e.id !== id).map((e, i) => ({ ...e, position: i + 1 })));
    if (isSupabaseConfigured()) {
      persistDeleteQueueEntry(id).catch(console.error);
    }
  };

  const addToQueue = (entry: QueueEntry) =>
    setQueue(prev => {
      const newEntry = { ...entry, position: prev.length + 1 };
      if (isSupabaseConfigured()) {
        persistQueueEntry(newEntry).catch(console.error);
      }
      return [...prev, newEntry];
    });

  if (!hydrated) return null;

  return (
    <BarberProContext.Provider value={{
      appointments, setAppointments,
      queue, setQueue,
      barbers, setBarbers,
      services, setServices,
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
