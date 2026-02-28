"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { BARBERS, SERVICES } from "@/lib/mock-data";
import { Appointment } from "@/lib/types";
import { useBarberPro } from "@/lib/barberpro-context";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleAppointmentPopup from "@/components/schedule/ScheduleAppointmentPopup";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropReject, setDropReject] = useState<{
    time: string;
    barberId: string;
    durationMinutes: number;
  } | null>(null);

  const dragTimeRef = useRef<string | null>(null);
  const dragBarberRef = useRef<string | null>(null);

  const {
    appointments: allAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    moveAppointment,
  } = useBarberPro();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleStatusChange = (id: string, status: Appointment["status"]) => {
    if (status === "cancelled") {
      cancelAppointment(id);
    } else {
      updateAppointmentStatus(id, status);
    }
  };

  const getWeekDates = (offset: number): string[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(
      now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7
    );
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDayIndex];
  const dayAppointments = allAppointments.filter(
    (a) => a.date === selectedDate
  );

  const isDragging = activeDragId !== null;

  const draggedServiceId = useMemo(() => {
    if (!activeDragId || !activeDragId.startsWith("reschedule-")) return null;
    const aptId = activeDragId.replace("reschedule-", "");
    const apt = allAppointments.find((a) => a.id === aptId);
    return apt?.serviceId ?? null;
  }, [activeDragId, allAppointments]);

  const handleDragTimeChange = useCallback(
    (time: string | null, barberId: string | null) => {
      dragTimeRef.current = time;
      dragBarberRef.current = barberId;
    },
    [],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDropReject(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveDragId(null);

    if (!over) return;
    if (!activeId.startsWith("reschedule-")) return;

    const overId = over.id as string;
    const appointmentId = activeId.replace("reschedule-", "");
    const apt = allAppointments.find((a) => a.id === appointmentId);
    if (!apt) return;

    const service = SERVICES.find((s) => s.id === apt.serviceId);
    if (!service) return;

    let dropTime: string | null = null;
    let targetBarberId: string | null = null;

    if (overId.startsWith("schedule-timeline-")) {
      targetBarberId = overId.replace("schedule-timeline-", "");
      dropTime = dragTimeRef.current;
    } else if (overId.startsWith("cancelled-slot-")) {
      const cancelledAptId = overId.replace("cancelled-slot-", "");
      const cancelledApt = allAppointments.find(
        (a) => a.id === cancelledAptId
      );
      if (cancelledApt) {
        targetBarberId = cancelledApt.barberId;
        dropTime = cancelledApt.startTime;
      }
    }

    if (!dropTime || !targetBarberId) return;
    if (targetBarberId !== apt.barberId) return;

    const newStartMin = timeToMinutes(dropTime);
    const newEndMin = newStartMin + service.durationMinutes;
    const newEndTime = minutesToTime(newEndMin);

    if (newStartMin < 8 * 60 || newEndMin > 19 * 60) {
      setDropReject({
        time: dropTime,
        barberId: targetBarberId,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    const barberApts = allAppointments.filter(
      (a) =>
        a.barberId === targetBarberId &&
        a.date === selectedDate &&
        a.id !== appointmentId &&
        a.status !== "cancelled",
    );

    let hasOverlap = barberApts.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return newStartMin < aEnd && newEndMin > aStart;
    });

    const targetBarber = BARBERS.find((b) => b.id === targetBarberId);
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
        barberId: targetBarberId,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    moveAppointment(appointmentId, dropTime, newEndTime);
  }

  const formatWeekRange = (): string => {
    const first = new Date(weekDates[0] + "T12:00:00");
    const last = new Date(weekDates[6] + "T12:00:00");
    const fMonth = first.toLocaleDateString("en-US", { month: "short" });
    const lMonth = last.toLocaleDateString("en-US", { month: "short" });
    const fDay = first.getDate();
    const lDay = last.getDate();
    const year = last.getFullYear();
    if (fMonth === lMonth) {
      return `${fMonth} ${fDay} – ${lDay}, ${year}`;
    }
    return `${fMonth} ${fDay} – ${lMonth} ${lDay}, ${year}`;
  };

  const weekRangeLabel = formatWeekRange();

  const todayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Week navigation header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              ←
            </button>
            <span className="font-semibold text-gray-900 text-sm">
              {weekRangeLabel}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              →
            </button>
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => {
                setWeekOffset(0);
                setSelectedDayIndex(todayIndex);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Today
            </button>
          )}
        </div>

        {/* Day tab bar */}
        <div className="flex gap-1 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
          {weekDates.map((date, i) => {
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dayNum = new Date(date + "T12:00:00").getDate();
            const isToday =
              date === new Date().toISOString().split("T")[0];
            const isSelected = i === selectedDayIndex;
            return (
              <button
                key={date}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-colors relative ${
                  isSelected
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{dayNames[i]}</span>
                <span
                  className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-900"}`}
                >
                  {dayNum}
                </span>
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Barber columns */}
        <ScheduleGrid
          date={selectedDate}
          barbers={BARBERS}
          appointments={dayAppointments}
          services={SERVICES}
          onAppointmentClick={setSelectedAppointment}
          onDragTimeChange={handleDragTimeChange}
          isDragging={isDragging}
          draggedServiceId={draggedServiceId}
          dropReject={dropReject}
        />

        {selectedAppointment && (
          <ScheduleAppointmentPopup
            appointment={selectedAppointment}
            barber={
              BARBERS.find((b) => b.id === selectedAppointment.barberId)!
            }
            service={SERVICES.find(
              (s) => s.id === selectedAppointment.serviceId
            )}
            onStatusChange={handleStatusChange}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
