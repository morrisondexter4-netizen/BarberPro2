"use client";

import { Appointment, Barber } from "@/lib/types";
import AppointmentSlot from "./AppointmentSlot";

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

type Props = {
  appointments: Appointment[];
  barbers: Barber[];
  onDropIntoSlot: (queueEntryId: string, slotId: string) => void;
};

export default function DayView({
  appointments,
  barbers,
  onDropIntoSlot,
}: Props) {
  return (
    <div className="overflow-y-auto h-full px-2 pt-2">
      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
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
              <div className="flex-1 border-t border-gray-100" />
            </div>
          </div>
        ))}

        {appointments.map((apt) => {
          const startMin = timeToMinutes(apt.startTime);
          const endMin = timeToMinutes(apt.endTime);
          const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
          const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
          const barber = barbers.find((b) => b.id === apt.barberId);

          return (
            <div
              key={apt.id}
              className="absolute left-16 right-2"
              style={{ top: top + 1, height: height - 2 }}
            >
              <AppointmentSlot
                appointment={apt}
                barber={barber}
                isDropTarget={false}
                onDrop={(queueEntryId) =>
                  onDropIntoSlot(queueEntryId, apt.id)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
