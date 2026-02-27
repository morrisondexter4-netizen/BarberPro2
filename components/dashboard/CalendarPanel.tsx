"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Appointment, Barber, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

type Props = {
  appointments: Appointment[];
  barber: Barber;
  services: Service[];
  onAppointmentClick: (apt: Appointment) => void;
  isDragging: boolean;
  draggedServiceId: string | null;
  onDragTimeChange: (time: string | null) => void;
  dropReject: { time: string; durationMinutes: number } | null;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const HOUR_HEIGHT = 80;
const START_HOUR = 8;

function formatHour(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

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

function BookedAppointmentCard({
  appointment,
  barber,
  serviceName,
  onClick,
}: {
  appointment: Appointment;
  barber: Barber;
  serviceName: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: "move-" + appointment.id });

  const colors = BARBER_COLOR_MAP[barber.color] ?? BARBER_COLOR_MAP.blue;
  const isNoShow = appointment.status === "no-show";

  const style: React.CSSProperties = {
    backgroundColor: `${colors.hex}15`,
    borderLeftColor: colors.hex,
    ...(transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: 50,
        }
      : {}),
    ...(isDragging ? { opacity: 0.7 } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={onClick}
      className={`h-full w-full rounded-lg border-l-4 px-2.5 py-1.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all duration-150 ${
        isNoShow ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`font-medium text-sm text-gray-900 truncate ${isNoShow ? "line-through" : ""}`}
        >
          {appointment.clientName}
        </span>
        {appointment.status === "checked-in" && (
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        )}
        {appointment.status === "paid" && (
          <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded px-1 flex-shrink-0">
            $
          </span>
        )}
        {appointment.fromQueue && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded px-1 flex-shrink-0">
            Q
          </span>
        )}
      </div>
      <p
        className={`text-xs opacity-75 truncate ${isNoShow ? "line-through" : ""}`}
      >
        {serviceName}
      </p>
    </div>
  );
}

export default function CalendarPanel({
  appointments,
  barber,
  services,
  onAppointmentClick,
  isDragging,
  draggedServiceId,
  onDragTimeChange,
  dropReject,
}: Props) {
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-${barber.id}`,
  });

  const mergeRefs = useCallback(
    (node: HTMLDivElement | null) => {
      timelineRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const colors = BARBER_COLOR_MAP[barber.color] ?? BARBER_COLOR_MAP.blue;

  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    services.forEach((s) => {
      m[s.id] = s;
    });
    return m;
  }, [services]);

  const draggedService = useMemo(() => {
    if (!draggedServiceId) return null;
    return services.find((s) => s.id === draggedServiceId) ?? null;
  }, [draggedServiceId, services]);

  useEffect(() => {
    if (!isDragging) {
      setDragOverTime(null);
      onDragTimeChange(null);
      return;
    }

    function handlePointerMove(e: PointerEvent) {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;

      if (relativeY < 0 || relativeY > rect.height) {
        setDragOverTime(null);
        onDragTimeChange(null);
        return;
      }

      const totalMinutes =
        Math.round(relativeY / (HOUR_HEIGHT / 60) / 15) * 15;
      const clampedMinutes = Math.max(0, Math.min(11 * 60, totalMinutes));
      const hours = Math.floor(clampedMinutes / 60) + START_HOUR;
      const mins = clampedMinutes % 60;
      const time = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      setDragOverTime(time);
      onDragTimeChange(time);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isDragging, onDragTimeChange]);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  const visibleAppointments = appointments.filter(
    (a) => a.clientName !== "Open Slot",
  );

  const highlightBar = useMemo(() => {
    if (dropReject) {
      const startMin = timeToMinutes(dropReject.time);
      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = (dropReject.durationMinutes / 60) * HOUR_HEIGHT;
      return { top, height, isReject: true, time: dropReject.time };
    }
    if (isDragging && isOver && dragOverTime && draggedService) {
      const startMin = timeToMinutes(dragOverTime);
      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = (draggedService.durationMinutes / 60) * HOUR_HEIGHT;
      return { top, height, isReject: false, time: dragOverTime };
    }
    return null;
  }, [dropReject, isDragging, isOver, dragOverTime, draggedService]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <span className={`w-3 h-3 rounded-full ${colors.bg}`} />
        <h2 className="text-lg font-semibold text-gray-900">
          Today&apos;s Schedule
        </h2>
        <span className="text-sm text-gray-400 ml-auto">{todayLabel}</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
        <div
          ref={mergeRefs}
          className="relative"
          style={{ height: totalHeight }}
        >
          {/* Hour lines + 15-min increments */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0"
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
            >
              <div className="flex items-start">
                <span className="text-xs text-gray-400 w-14 flex-shrink-0 -translate-y-2 text-right pr-3 select-none">
                  {formatHour(hour)}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              {[1, 2, 3].map((q) => (
                <div
                  key={q}
                  className="absolute left-14 right-0"
                  style={{ top: q * 20 }}
                >
                  {q === 2 ? (
                    <div className="flex items-center gap-0">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1 border-t border-dashed border-gray-100" />
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Lunch break */}
          {barber.lunchBreak &&
            (() => {
              const lunchStart = timeToMinutes(barber.lunchBreak!.startTime);
              const lunchEnd = timeToMinutes(barber.lunchBreak!.endTime);
              const top =
                ((lunchStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
              const height = ((lunchEnd - lunchStart) / 60) * HOUR_HEIGHT;
              return (
                <div
                  className="absolute left-16 right-2 bg-gray-100 border-l-4 border-gray-300 rounded-lg flex items-center justify-center"
                  style={{ top, height }}
                >
                  <span className="text-xs text-gray-400 font-medium">
                    Lunch Break
                  </span>
                </div>
              );
            })()}

          {/* Highlight bar for drag preview / rejection flash */}
          {highlightBar && (
            <div
              className={`absolute left-16 right-2 rounded-lg border-2 border-dashed flex items-center justify-center z-10 transition-colors duration-150 ${
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
          {visibleAppointments.map((apt) => {
            const startMin = timeToMinutes(apt.startTime);
            const endMin = timeToMinutes(apt.endTime);
            const top =
              ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const rawHeight = ((endMin - startMin) / 60) * HOUR_HEIGHT;
            const height = Math.max(rawHeight, 20);
            const service = serviceMap[apt.serviceId];

            return (
              <div
                key={apt.id}
                className="absolute left-16 right-2"
                style={{ top: top + 1, height: height - 2 }}
              >
                <BookedAppointmentCard
                  appointment={apt}
                  barber={barber}
                  serviceName={service?.name ?? ""}
                  onClick={() => onAppointmentClick(apt)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
