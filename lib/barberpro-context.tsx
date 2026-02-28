"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Appointment, QueueEntry } from "./types"
import { INITIAL_APPOINTMENTS, INITIAL_QUEUE } from "./mock-data"

type BarberProContextType = {
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  queue: QueueEntry[]
  setQueue: React.Dispatch<React.SetStateAction<QueueEntry[]>>
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void
  moveAppointment: (id: string, newStartTime: string, newEndTime: string) => void
  cancelAppointment: (id: string) => void
  addAppointment: (apt: Appointment) => void
  removeFromQueue: (id: string) => void
}

const BarberProContext = createContext<BarberProContextType | null>(null)

export function BarberProProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [queue, setQueue] = useState<QueueEntry[]>(INITIAL_QUEUE)

  const updateAppointmentStatus = (id: string, status: Appointment["status"]) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const moveAppointment = (id: string, newStartTime: string, newEndTime: string) => {
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, startTime: newStartTime, endTime: newEndTime } : a
    ))
  }

  const cancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: "cancelled" } : a
    ))
  }

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt])
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const filtered = prev.filter(e => e.id !== id)
      return filtered.map((e, i) => ({ ...e, position: i + 1 }))
    })
  }

  return (
    <BarberProContext.Provider value={{
      appointments,
      setAppointments,
      queue,
      setQueue,
      updateAppointmentStatus,
      moveAppointment,
      cancelAppointment,
      addAppointment,
      removeFromQueue,
    }}>
      {children}
    </BarberProContext.Provider>
  )
}

export function useBarberPro() {
  const ctx = useContext(BarberProContext)
  if (!ctx) throw new Error("useBarberPro must be used within BarberProProvider")
  return ctx
}
