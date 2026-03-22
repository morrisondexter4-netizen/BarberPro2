"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Barber, Appointment, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

const HOUR_HEIGHT = 64;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (extracted so they can call hooks)                  */
/* ------------------------------------------------------------------ */

function DraggableAppointmentCard({
  apt,
  service,
  colors,
  onClick,
  startHour,
}: {
  apt: Appointment;
  service: Service | undefined;
  colors: { hex: string; bg: string; border: string; light: string };
  onClick: () => void;
  startHour: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "reschedule-" + apt.id,
    data: {
      type: "reschedule",
      appointmentId: apt.id,
      serviceId: apt.serviceId,
    },
  });

  const [sh, sm] = apt.startTime.split(":").map(Number);
  const [eh, em] = apt.endTime.split(":").map(Number);
  const top = (sh - startHour) * HOUR_HEIGHT + (sm / 60) * HOUR_HEIGHT;
  const height = Math.max(
    52,
    ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_HEIGHT
  );

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute left-1 right-1 rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing overflow-hidden transition-all hover:brightness-95 ${
        isDragging ? "opacity-40" : ""
      }`}
      style={{
        top,
        height,
        backgroundColor: colors.hex + "20",
        borderLeft: `3px solid ${colors.hex}`,
      }}
      onClick={onClick}
    >
      <p className="text-xs font-semibold text-gray-900 truncate">
        {apt.clientName}
      </p>
      {height >= 44 && (
        <p className="text-xs text-gray-500 truncate">{service?.name}</p>
      )}
    </div>
  );
}

function DroppableCancelledCard({
  apt,
  service,
  onClick,
  startHour,
}: {
  apt: Appointment;
  service: Service | undefined;
  onClick: () => void;
  startHour: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "cancelled-slot-" + apt.id,
    data: {
      type: "cancelled-slot",
      appointmentId: apt.id,
      barberId: apt.barberId,
      startTime: apt.startTime,
    },
  });

  const [sh, sm] = apt.startTime.split(":").map(Number);
  const [eh, em] = apt.endTime.split(":").map(Number);
  const top = (sh - startHour) * HOUR_HEIGHT + (sm / 60) * HOUR_HEIGHT;
  const height = Math.max(
    52,
    ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_HEIGHT
  );

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden transition-all hover:brightness-95 ${
        isOver
          ? "opacity-100 ring-2 ring-blue-400 bg-blue-50"
          : "opacity-40"
      }`}
      style={{
        top,
        height,
        backgroundColor: isOver ? undefined : "#f3f4f6",
        borderLeft: `3px solid ${isOver ? "#60a5fa" : "#d1d5db"}`,
        filter: isOver ? undefined : "grayscale(1)",
      }}
      onClick={onClick}
    >
      <p
        className={`text-xs font-semibold text-gray-900 truncate ${
          isOver ? "" : "line-through"
        }`}
      >
        {apt.clientName}
      </p>
      {height >= 44 && (
        <p className="text-xs text-gray-500 truncate">{service?.name}</p>
      )}
    </div>
  );
}

function DroppableBarberColumn({
  barberId,
  isLastColumn,
  onRefMount,
  children,
  timelineHeight,
}: {
  barberId: string;
  isLastColumn: boolean;
  onRefMount: (barberId: string, el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  timelineHeight: number;
}) {
  const { setNodeRef } = useDroppable({
    id: "schedule-timeline-" + barberId,
  });

  const mergeRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      onRefMount(barberId, node);
    },
    [setNodeRef, barberId, onRefMount],
  );

  return (
    <div
      ref={mergeRefs}
      className={`flex-1 relative border-l border-gray-100 ${
        isLastColumn ? "" : "border-r border-gray-100"
      }`}
      style={{ height: timelineHeight }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main grid                                                         */
/* ------------------------------------------------------------------ */

interface ScheduleGridProps {
  date: string;
  barbers: Barber[];
  appointments: Appointment[];
  services: Service[];
  onAppointmentClick: (apt: Appointment) => void;
  onDragTimeChange: (time: string | null, barberId: string | null) => void;
  isDragging: boolean;
  draggedServiceId: string | null;
  dropReject: {
    time: string;
    barberId: string;
    durationMinutes: number;
  } | null;
  startHour: number;
  endHour: number;
}

export default function ScheduleGrid({
  barbers,
  appointments,
  services,
  onAppointmentClick,
  onDragTimeChange,
  isDragging,
  draggedServiceId,
  dropReject,
  startHour,
  endHour,
}: ScheduleGridProps) {
  const TOTAL_HOURS = endHour - startHour;
  const TIMELINE_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const [dragOverBarberId, setDragOverBarberId] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setColumnRef = useCallback(
    (barberId: string, el: HTMLDivElement | null) => {
      columnRefs.current[barberId] = el;
    },
    [],
  );

  const draggedService = useMemo(() => {
    if (!draggedServiceId) return null;
    return services.find((s) => s.id === draggedServiceId) ?? null;
  }, [draggedServiceId, services]);

  useEffect(() => {
    if (!isDragging) {
      setDragOverTime(null);
      setDragOverBarberId(null);
      return;
    }

    function handlePointerMove(e: PointerEvent) {
      let foundBarberId: string | null = null;
      let relativeY = 0;

      for (const [barberId, el] of Object.entries(columnRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right) {
          foundBarberId = barberId;
          relativeY = e.clientY - rect.top;
          break;
        }
      }

      if (!foundBarberId || relativeY < 0 || relativeY > TIMELINE_HEIGHT) {
        setDragOverTime(null);
        setDragOverBarberId(null);
        onDragTimeChange(null, null);
        return;
      }

      const totalMinutes =
        Math.round(relativeY / (HOUR_HEIGHT / 60) / 15) * 15;
      const clampedMinutes = Math.max(
        0,
        Math.min(TOTAL_HOURS * 60, totalMinutes)
      );
      const hours = Math.floor(clampedMinutes / 60) + startHour;
      const mins = clampedMinutes % 60;
      const time = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      setDragOverTime(time);
      setDragOverBarberId(foundBarberId);
      onDragTimeChange(time, foundBarberId);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isDragging, onDragTimeChange, TIMELINE_HEIGHT, TOTAL_HOURS, startHour]);

  const highlightBar = useMemo(() => {
    if (dropReject) {
      const startMin = timeToMinutes(dropReject.time);
      const top = ((startMin - startHour * 60) / 60) * HOUR_HEIGHT;
      const height = (dropReject.durationMinutes / 60) * HOUR_HEIGHT;
      return {
        top,
        height,
        isReject: true,
        time: dropReject.time,
        barberId: dropReject.barberId,
      };
    }
    if (isDragging && dragOverTime && dragOverBarberId && draggedService) {
      const startMin = timeToMinutes(dragOverTime);
      const top = ((startMin - startHour * 60) / 60) * HOUR_HEIGHT;
      const height = (draggedService.durationMinutes / 60) * HOUR_HEIGHT;
      return {
        top,
        height,
        isReject: false,
        time: dragOverTime,
        barberId: dragOverBarberId,
      };
    }
    return null;
  }, [dropReject, isDragging, dragOverTime, dragOverBarberId, draggedService, startHour]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky barber header */}
      <div className="flex shrink-0 border-b border-gray-100 bg-white">
        <div className="w-14 shrink-0" />
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-l border-gray-100"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${BARBER_COLOR_MAP[barber.color].bg}`}
            />
            <span className="text-sm font-semibold text-gray-900">
              {barber.name}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 overflow-y-auto pt-3">
        {/* Time gutter */}
        <div
          className="w-14 shrink-0 relative bg-white"
          style={{ height: TIMELINE_HEIGHT }}
        >
          {Array.from({ length: TOTAL_HOURS }, (_, i) => {
            const hour = i + startHour;
            const label = hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
            return (
              <div
                key={hour}
                className="absolute right-2 text-xs text-gray-400"
                style={{ top: i * HOUR_HEIGHT - 8 }}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Barber columns */}
        {barbers.map((barber, idx) => {
          const barberApts = appointments.filter(
            (a) => a.barberId === barber.id
          );
          const colors = BARBER_COLOR_MAP[barber.color];
          const isLast = idx === barbers.length - 1;

          // Per-barber out-of-hours blocks
          const barberStartMin = timeToMinutes(barber.startTime ?? `${startHour}:00`);
          const barberEndMin = timeToMinutes(barber.endTime ?? `${endHour}:00`);
          const gridStartMin = startHour * 60;
          const gridEndMin = endHour * 60;

          const beforeHeight = ((barberStartMin - gridStartMin) / 60) * HOUR_HEIGHT;
          const afterTop = ((barberEndMin - gridStartMin) / 60) * HOUR_HEIGHT;
          const afterHeight = ((gridEndMin - barberEndMin) / 60) * HOUR_HEIGHT;

          return (
            <DroppableBarberColumn
              key={barber.id}
              barberId={barber.id}
              isLastColumn={isLast}
              onRefMount={setColumnRef}
              timelineHeight={TIMELINE_HEIGHT}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}
              {/* 15-min lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) =>
                [16, 32, 48].map((offset) => (
                  <div
                    key={`${i}-${offset}`}
                    className="absolute w-full border-t border-dashed border-gray-50"
                    style={{ top: i * HOUR_HEIGHT + offset }}
                  />
                ))
              )}

              {/* Before-hours block */}
              {beforeHeight > 0 && (
                <div
                  className="absolute left-0 right-0 bg-gray-100 border-l-4 border-gray-300 flex items-center px-2 z-10"
                  style={{ top: 0, height: beforeHeight }}
                >
                  <span className="text-xs text-gray-400">Closed</span>
                </div>
              )}

              {/* After-hours block */}
              {afterHeight > 0 && (
                <div
                  className="absolute left-0 right-0 bg-gray-100 border-l-4 border-gray-300 flex items-center px-2 z-10"
                  style={{ top: afterTop, height: afterHeight }}
                >
                  <span className="text-xs text-gray-400">Closed</span>
                </div>
              )}

              {/* Lunch break */}
              {barber.lunchBreak &&
                (() => {
                  const [sh, sm] = barber.lunchBreak.start
                    .split(":")
                    .map(Number);
                  const [eh, em] = barber.lunchBreak.end
                    .split(":")
                    .map(Number);
                  const top =
                    (sh - startHour) * HOUR_HEIGHT + (sm / 60) * HOUR_HEIGHT;
                  const height =
                    ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_HEIGHT;
                  return (
                    <div
                      className="absolute left-0 right-0 bg-gray-100 border-l-4 border-gray-300 flex items-center px-2"
                      style={{ top, height }}
                    >
                      <span className="text-xs text-gray-400">Lunch</span>
                    </div>
                  );
                })()}

              {/* Highlight bar for drag preview / rejection flash */}
              {highlightBar && highlightBar.barberId === barber.id && (
                <div
                  className={`absolute left-1 right-1 rounded-lg border-2 border-dashed flex items-center justify-center z-10 transition-colors duration-150 ${
                    highlightBar.isReject
                      ? "bg-red-50 border-red-400"
                      : "bg-blue-100 border-blue-400"
                  }`}
                  style={{
                    top: highlightBar.top,
                    height: highlightBar.height,
                    opacity: 0.8,
                  }}
                >
                  <span
                    className={`text-xs font-medium ${
                      highlightBar.isReject ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {highlightBar.isReject
                      ? "Cannot place here"
                      : `Drop here — ${formatTime12(highlightBar.time)}`}
                  </span>
                </div>
              )}

              {/* Appointments */}
              {barberApts.map((apt) => {
                const service = services.find((s) => s.id === apt.serviceId);
                if (apt.status === "cancelled") {
                  return (
                    <DroppableCancelledCard
                      key={apt.id}
                      apt={apt}
                      service={service}
                      onClick={() => onAppointmentClick(apt)}
                      startHour={startHour}
                    />
                  );
                }
                return (
                  <DraggableAppointmentCard
                    key={apt.id}
                    apt={apt}
                    service={service}
                    colors={colors}
                    onClick={() => onAppointmentClick(apt)}
                    startHour={startHour}
                  />
                );
              })}
            </DroppableBarberColumn>
          );
        })}
      </div>
    </div>
  );
}
