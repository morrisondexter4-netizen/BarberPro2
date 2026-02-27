"use client";

import { Appointment, Barber } from "@/lib/types";
import AppointmentSlot from "./AppointmentSlot";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getWeekDays(dateStr: string): string[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

type Props = {
  appointments: Appointment[];
  barbers: Barber[];
  selectedDate: string;
  onDropIntoSlot: (queueEntryId: string, slotId: string) => void;
};

export default function WeekView({
  appointments,
  barbers,
  selectedDate,
  onDropIntoSlot,
}: Props) {
  const weekDays = getWeekDays(selectedDate);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="overflow-auto h-full">
      <div className="flex sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="w-14 flex-shrink-0" />
        {weekDays.map((day, i) => {
          const d = new Date(day + "T00:00:00");
          const isToday = day === todayStr;
          return (
            <div
              key={day}
              className={`flex-1 text-center py-2 ${
                isToday ? "border-b-2 border-blue-500" : ""
              }`}
            >
              <span className="text-xs text-gray-500 block">
                {DAY_NAMES[i]}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isToday ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex">
        <div className="w-14 flex-shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start"
            >
              <span className="text-xs text-gray-400 w-full text-right pr-2 -translate-y-2 select-none">
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const dayAppointments = appointments.filter((a) => a.date === day);
          return (
            <div
              key={day}
              className="flex-1 relative border-l border-gray-50"
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-t border-gray-100"
                />
              ))}

              {dayAppointments.map((apt) => {
                const startMin = timeToMinutes(apt.startTime);
                const endMin = timeToMinutes(apt.endTime);
                const top =
                  ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                const barber = barbers.find((b) => b.id === apt.barberId);

                return (
                  <div
                    key={apt.id}
                    className="absolute inset-x-0.5"
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
          );
        })}
      </div>
    </div>
  );
}
