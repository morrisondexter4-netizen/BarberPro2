"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  BARBERS,
  SERVICES,
} from "@/lib/mock-data";
import { Barber, Appointment } from "@/lib/types";
import { useBarberPro } from "@/lib/barberpro-context";
import BarberSwitcher from "@/components/dashboard/BarberSwitcher";
import CalendarPanel from "@/components/dashboard/CalendarPanel";
import QueuePanel from "@/components/dashboard/QueuePanel";
import AppointmentPopup from "@/components/dashboard/AppointmentPopup";
import DragConfirmPopup from "@/components/dashboard/DragConfirmPopup";

const BARBERS_STORAGE_KEY = "barberpro.shopSettings.barbers";

function loadBarbers(): Barber[] {
  if (typeof window === "undefined") return BARBERS;
  try {
    const raw = localStorage.getItem(BARBERS_STORAGE_KEY);
    if (!raw) return BARBERS;
    const parsed = JSON.parse(raw) as Barber[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BARBERS;
  } catch {
    return BARBERS;
  }
}

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

  const {
    appointments,
    queue,
    updateAppointmentStatus,
    moveAppointment,
    addAppointment,
    removeFromQueue,
  } = useBarberPro();

  const [barbers, setBarbers] = useState<Barber[]>(BARBERS);
  useEffect(() => {
    setBarbers(loadBarbers());
  }, []);

  const [selectedBarberId, setSelectedBarberId] = useState(BARBERS[0].id);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);
  const [pendingAppointment, setPendingAppointment] = useState<{
    appointment: Appointment;
    queueEntryId: string;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const [dropReject, setDropReject] = useState<{
    time: string;
    durationMinutes: number;
  } | null>(null);
  const dragTimeRef = useRef<string | null>(null);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId) ?? barbers[0]!;

  const barberQueue = queue
    .filter((e) => e.barberId === selectedBarberId)
    .sort((a, b) => a.position - b.position);

  const barberAppointments = (() => {
    const base = appointments.filter(
      (a) =>
        a.barberId === selectedBarberId &&
        a.date === today &&
        a.status !== "cancelled",
    );
    if (
      pendingAppointment &&
      pendingAppointment.appointment.barberId === selectedBarberId
    ) {
      return [...base, pendingAppointment.appointment];
    }
    return base;
  })();

  const isRescheduleDragging =
    activeDragId !== null && activeDragId.startsWith("reschedule-");
  const isQueueDragging =
    activeDragId !== null && !isRescheduleDragging;
  const isTimelineDragging = isQueueDragging || isRescheduleDragging;
  const draggedEntry = isQueueDragging
    ? queue.find((q) => q.id === activeDragId)
    : null;
  const draggedServiceId = (() => {
    if (isQueueDragging && draggedEntry) return draggedEntry.serviceId;
    if (isRescheduleDragging && activeDragId) {
      const aptId = activeDragId.replace("reschedule-", "");
      const apt = appointments.find((a) => a.id === aptId);
      return apt?.serviceId ?? null;
    }
    return null;
  })();

  const handleDragTimeChange = useCallback((time: string | null) => {
    dragTimeRef.current = time;
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDropReject(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveDragId(null);

    if (!over) return;
    const overId = over.id as string;
    if (!overId.startsWith("timeline-")) return;

    const barberId = overId.replace("timeline-", "");
    const dropTime = dragTimeRef.current;
    if (!dropTime) return;

    if (activeId.startsWith("reschedule-")) {
      const appointmentId = activeId.replace("reschedule-", "");
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) return;

      const service = SERVICES.find((s) => s.id === apt.serviceId);
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
          a.clientName !== "Open Slot" &&
          a.id !== appointmentId &&
          a.status !== "cancelled",
      );
      let hasOverlap = barberApts.some((a) => {
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        return newStartMin < aEnd && newEndMin > aStart;
      });

      const targetBarber = barbers.find((b) => b.id === barberId);
      if (!hasOverlap && targetBarber?.lunchBreak) {
        const lStart = timeToMinutes(targetBarber.lunchBreak.start);
        const lEnd = timeToMinutes(targetBarber.lunchBreak.end);
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

      moveAppointment(appointmentId, dropTime, minutesToTime(newEndMin));
      return;
    }

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
        a.clientName !== "Open Slot" &&
        a.status !== "cancelled",
    );
    let hasOverlap = barberApts.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return newStartMin < aEnd && newEndMin > aStart;
    });

    const targetBarber = barbers.find((b) => b.id === barberId);
    if (!hasOverlap && targetBarber?.lunchBreak) {
      const lStart = timeToMinutes(targetBarber.lunchBreak.start);
      const lEnd = timeToMinutes(targetBarber.lunchBreak.end);
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
      clientPhone: entry.clientPhone ?? "",
      clientEmail: entry.clientEmail ?? "",
      serviceId: entry.serviceId,
      barberId,
      startTime: dropTime,
      endTime: minutesToTime(newEndMin),
      date: today,
      status: "scheduled",
      fromQueue: true,
    };
    setPendingAppointment({ appointment: newApt, queueEntryId: activeId });
  }

  function handleStatusChange(
    appointmentId: string,
    status: Appointment["status"],
  ) {
    updateAppointmentStatus(appointmentId, status);
    setActiveAppointment(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Barber Switcher Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">Viewing:</span>
          <BarberSwitcher
            barbers={barbers}
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
              isDragging={isTimelineDragging}
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

        {/* Drag confirm / undo popup */}
        {pendingAppointment && (
          <DragConfirmPopup
            appointment={pendingAppointment.appointment}
            barber={
              barbers.find(
                (b) => b.id === pendingAppointment.appointment.barberId,
              ) ?? selectedBarber
            }
            service={SERVICES.find(
              (s) => s.id === pendingAppointment.appointment.serviceId,
            )}
            onConfirm={() => {
              addAppointment(pendingAppointment.appointment);
              removeFromQueue(pendingAppointment.queueEntryId);
              setPendingAppointment(null);
            }}
            onUndo={() => {
              setPendingAppointment(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
}
