"use client";

import { useState, useRef, useCallback } from "react";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  BARBERS,
  SERVICES,
  INITIAL_QUEUE,
  INITIAL_APPOINTMENTS,
} from "@/lib/mock-data";
import { QueueEntry, Appointment } from "@/lib/types";
import BarberSwitcher from "@/components/dashboard/BarberSwitcher";
import CalendarPanel from "@/components/dashboard/CalendarPanel";
import QueuePanel from "@/components/dashboard/QueuePanel";
import AppointmentPopup from "@/components/dashboard/AppointmentPopup";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedBarberId, setSelectedBarberId] = useState(BARBERS[0].id);
  const [queue, setQueue] = useState<QueueEntry[]>(INITIAL_QUEUE);
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropReject, setDropReject] = useState<{
    time: string;
    durationMinutes: number;
  } | null>(null);
  const dragTimeRef = useRef<string | null>(null);

  const selectedBarber = BARBERS.find((b) => b.id === selectedBarberId)!;

  const barberQueue = queue
    .filter((e) => e.barberId === selectedBarberId)
    .sort((a, b) => a.position - b.position);

  const barberAppointments = appointments.filter(
    (a) => a.barberId === selectedBarberId && a.date === today,
  );

  const isQueueDragging =
    activeDragId !== null && !activeDragId.startsWith("move-");
  const draggedEntry = isQueueDragging
    ? queue.find((q) => q.id === activeDragId)
    : null;
  const draggedServiceId = draggedEntry?.serviceId ?? null;

  const handleDragTimeChange = useCallback((time: string | null) => {
    dragTimeRef.current = time;
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDropReject(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    const activeId = active.id as string;
    setActiveDragId(null);

    if (activeId.startsWith("move-")) {
      const appointmentId = activeId.replace("move-", "");
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) return;

      const deltaMinutes = (delta.y / 80) * 60;
      const startMinutes = timeToMinutes(apt.startTime) + deltaMinutes;
      const snappedMinutes = Math.round(startMinutes / 15) * 15;
      const clampedMinutes = Math.max(
        8 * 60,
        Math.min(19 * 60, snappedMinutes),
      );
      handleMoveAppointment(appointmentId, minutesToTime(clampedMinutes));
      return;
    }

    if (!over) return;
    const overId = over.id as string;
    if (!overId.startsWith("timeline-")) return;

    const barberId = overId.replace("timeline-", "");
    const dropTime = dragTimeRef.current;
    if (!dropTime) return;

    const entry = queue.find((q) => q.id === activeId);
    if (!entry) return;

    const service = SERVICES.find((s) => s.id === entry.serviceId);
    if (!service) return;

    const newStartMin = timeToMinutes(dropTime);
    const newEndMin = newStartMin + service.durationMinutes;

    if (newStartMin < 8 * 60 || newEndMin > 19 * 60) {
      setDropReject({
        time: dropTime,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    const barberApts = appointments.filter(
      (a) =>
        a.barberId === barberId &&
        a.date === today &&
        a.clientName !== "Open Slot",
    );
    let hasOverlap = barberApts.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return newStartMin < aEnd && newEndMin > aStart;
    });

    const targetBarber = BARBERS.find((b) => b.id === barberId);
    if (!hasOverlap && targetBarber?.lunchBreak) {
      const lStart = timeToMinutes(targetBarber.lunchBreak.startTime);
      const lEnd = timeToMinutes(targetBarber.lunchBreak.endTime);
      if (newStartMin < lEnd && newEndMin > lStart) {
        hasOverlap = true;
      }
    }

    if (hasOverlap) {
      setDropReject({
        time: dropTime,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      clientName: entry.clientName,
      serviceId: entry.serviceId,
      barberId,
      startTime: dropTime,
      endTime: minutesToTime(newEndMin),
      date: today,
      status: "scheduled",
      fromQueue: true,
    };
    setAppointments((prev) => [...prev, newApt]);

    const entryBarberId = entry.barberId;
    const withoutEntry = queue.filter((q) => q.id !== activeId);
    let pos = 0;
    const newQueue = withoutEntry.map((q) => {
      if (q.barberId === entryBarberId) {
        pos++;
        return { ...q, position: pos };
      }
      return q;
    });
    setQueue(newQueue);
  }

  function handleStatusChange(
    appointmentId: string,
    status: Appointment["status"],
  ) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a)),
    );
    setActiveAppointment(null);
  }

  function handleMoveAppointment(appointmentId: string, newStartTime: string) {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== appointmentId) return a;
        const duration =
          timeToMinutes(a.endTime) - timeToMinutes(a.startTime);
        const newEndTime = minutesToTime(
          timeToMinutes(newStartTime) + duration,
        );
        return { ...a, startTime: newStartTime, endTime: newEndTime };
      }),
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Barber Switcher Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">Viewing:</span>
          <BarberSwitcher
            barbers={BARBERS}
            selectedId={selectedBarberId}
            onChange={setSelectedBarberId}
          />
          <span className="ml-auto text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CalendarPanel
              appointments={barberAppointments}
              barber={selectedBarber}
              services={SERVICES}
              onAppointmentClick={(apt) => setActiveAppointment(apt)}
              isDragging={isQueueDragging}
              draggedServiceId={draggedServiceId}
              onDragTimeChange={handleDragTimeChange}
              dropReject={dropReject}
            />
          </div>
          <div className="w-72 overflow-hidden">
            <QueuePanel
              queue={barberQueue}
              barber={selectedBarber}
              services={SERVICES}
              totalWaiting={barberQueue.length}
            />
          </div>
        </div>

        {/* Appointment popup */}
        {activeAppointment && (
          <AppointmentPopup
            appointment={activeAppointment}
            barber={selectedBarber}
            service={SERVICES.find(
              (s) => s.id === activeAppointment.serviceId,
            )}
            onStatusChange={handleStatusChange}
            onClose={() => setActiveAppointment(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
